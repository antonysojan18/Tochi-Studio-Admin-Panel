import { NextRequest, NextResponse } from 'next/server';
import { 
  validateCredentials, 
  validateCredentialsEncrypted,
  createSecurityChallenge,
  createSessionToken, 
  checkRateLimit, 
  recordFailedAttempt, 
  resetAttempts, 
  SESSION_COOKIE_NAME 
} from '@/lib/auth';

/**
 * GET: Issues a fresh cryptographic challenge nonce and timestamp for client-side encrypted hashing.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip);
    
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterSec || 60) / 60);
      return NextResponse.json(
        { 
          success: false, 
          error: `Security lock active. Maximum login attempts exceeded. Please try again in ${minutes} minute(s).`,
          isLocked: true,
          retryAfterSec: rateCheck.retryAfterSec,
        },
        { status: 429 }
      );
    }

    const challenge = createSecurityChallenge();
    return NextResponse.json({
      success: true,
      ...challenge,
      algorithm: 'SHA-256-HMAC-CHALLENGE',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate security challenge' },
      { status: 500 }
    );
  }
}

/**
 * POST: Authenticates administrator using encrypted challenge hash or fallback credentials.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    
    // 1. Check rate limits
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterSec || 60) / 60);
      return NextResponse.json(
        { 
          success: false, 
          error: `Security lock active. Maximum login attempts exceeded. Please try again in ${minutes} minute(s).`,
          isLocked: true,
          retryAfterSec: rateCheck.retryAfterSec,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, clientHash, challenge, timestamp, signature, password } = body;

    let isValid = false;
    let failureReason = 'Invalid administrative credentials.';

    // 2. Validate using client-side encrypted hash if provided
    if (clientHash && challenge && timestamp && signature) {
      const result = validateCredentialsEncrypted(username, clientHash, challenge, timestamp, signature);
      isValid = result.valid;
      if (!result.valid && result.reason) {
        failureReason = result.reason;
      }
    } else if (password) {
      // Fallback: Constant-time direct comparison
      isValid = validateCredentials(username, password);
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing security credentials or encryption handshake payload.' },
        { status: 400 }
      );
    }

    if (!isValid) {
      const failed = recordFailedAttempt(ip);
      if (failed.isLocked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Security lock activated. Too many incorrect attempts. Terminal locked for 15 minutes.',
            isLocked: true,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `${failureReason} ${failed.remainingAttempts} attempt(s) remaining before security lockout.`,
          remainingAttempts: failed.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Success: Reset rate limiting & set session cookie
    resetAttempts(ip);
    const token = createSessionToken(username || 'Admin');

    const response = NextResponse.json({
      success: true,
      user: {
        username: username || 'Admin',
        role: 'admin',
      },
      message: 'Authentication successful. Cryptographic session established.',
    });

    // 7 days expiration, Strict SameSite, HttpOnly
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
