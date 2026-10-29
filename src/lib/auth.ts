import crypto from 'crypto';
import { cookies } from 'next/headers';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'antony.18';
const AUTH_SECRET = process.env.AUTH_SECRET || 'tochi-labs-os-enterprise-secret-key-2026';
export const SESSION_COOKIE_NAME = 'tochi_session';

// In-memory rate limiting map: ip -> { count, lockedUntil }
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory consumed nonces for anti-replay protection (nonce -> expiryTimestamp)
const consumedNonces = new Map<string, number>();

// Clean up expired nonces periodically
function pruneConsumedNonces() {
  const now = Date.now();
  consumedNonces.forEach((expiresAt, nonce) => {
    if (expiresAt <= now) {
      consumedNonces.delete(nonce);
    }
  });
}

export interface AuthSession {
  username: string;
  role: 'admin';
  issuedAt: number;
  expiresAt: number;
}

export interface SecurityChallenge {
  challenge: string;
  timestamp: number;
  signature: string;
}

/**
 * Creates HMAC-SHA256 signature for token payload.
 */
function signPayload(payloadStr: string): string {
  return crypto.createHmac('sha256', AUTH_SECRET).update(payloadStr).digest('hex');
}

/**
 * Generates an ephemeral cryptographic challenge for client-side hashing & anti-replay.
 */
export function createSecurityChallenge(): SecurityChallenge {
  pruneConsumedNonces();
  const challenge = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(`${challenge}:${timestamp}`).digest('hex');
  return { challenge, timestamp, signature };
}

/**
 * Verifies that a challenge is authentic, fresh, and not yet consumed.
 */
export function verifySecurityChallenge(challenge: string, timestamp: number, signature: string): boolean {
  pruneConsumedNonces();
  if (!challenge || !timestamp || !signature) return false;

  const now = Date.now();
  // Valid for 2 minutes (120 seconds) to tolerate slight network or clock variations
  if (Math.abs(now - timestamp) > 120 * 1000) {
    return false;
  }

  // Anti-replay: cannot reuse the same challenge
  if (consumedNonces.has(challenge)) {
    return false;
  }

  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(`${challenge}:${timestamp}`).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  // Mark consumed for 3 minutes
  consumedNonces.set(challenge, now + 180 * 1000);
  return true;
}

/**
 * Creates a cryptographically signed session token.
 */
export function createSessionToken(username: string): string {
  const session: AuthSession = {
    username,
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadStr = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = signPayload(payloadStr);
  return `${payloadStr}.${signature}`;
}

/**
 * Validates a signed session token.
 */
export function verifySessionToken(token: string): AuthSession | null {
  try {
    const [payloadStr, signature] = token.split('.');
    if (!payloadStr || !signature) return null;

    const expectedSignature = signPayload(payloadStr);
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const json = Buffer.from(payloadStr, 'base64url').toString('utf-8');
    const session: AuthSession = JSON.parse(json);

    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch (err) {
    return null;
  }
}

/**
 * Checks rate limiting for an identifier (e.g. IP).
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (attempt.lockedUntil > now) {
    const retryAfterSec = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  // If lockout expired, reset
  if (attempt.lockedUntil > 0 && attempt.lockedUntil <= now) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - attempt.count);
  return { allowed: true, remainingAttempts: remaining };
}

/**
 * Records a failed attempt for rate limiting.
 */
export function recordFailedAttempt(identifier: string): { remainingAttempts: number; isLocked: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(identifier, attempt);
    return { remainingAttempts: 0, isLocked: true, retryAfterSec: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  loginAttempts.set(identifier, attempt);
  return { remainingAttempts: MAX_ATTEMPTS - attempt.count, isLocked: false };
}

/**
 * Resets failed attempts after a successful login.
 */
export function resetAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

/**
 * Constant-time string hash helper.
 */
function sha256Hash(text: string): Buffer {
  return crypto.createHash('sha256').update(text).digest();
}

/**
 * Validates credentials using client-side encrypted/hashed challenge verification.
 * Client sends: SHA-256(SHA-256(password) + ":" + challenge + ":" + timestamp)
 */
export function validateCredentialsEncrypted(
  username: string,
  clientHash: string,
  challenge: string,
  timestamp: number,
  signature: string
): { valid: boolean; reason?: string } {
  if (!username || !clientHash || !challenge || !timestamp || !signature) {
    return { valid: false, reason: 'Incomplete cryptographic handshake payload' };
  }

  const isUserValid = username.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase();
  if (!isUserValid) {
    return { valid: false, reason: 'Invalid administrative identity' };
  }

  const isChallengeValid = verifySecurityChallenge(challenge, timestamp, signature);
  if (!isChallengeValid) {
    return { valid: false, reason: 'Security challenge expired or already consumed. Please refresh.' };
  }

  // Compute expected server hash:
  // 1. Password SHA-256 hash
  const storedPassHash = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');
  // 2. Combined payload hash
  const expectedHash = crypto.createHash('sha256').update(`${storedPassHash}:${challenge}:${timestamp}`).digest('hex');

  const clientBuf = Buffer.from(clientHash);
  const expBuf = Buffer.from(expectedHash);

  if (clientBuf.length !== expBuf.length || !crypto.timingSafeEqual(clientBuf, expBuf)) {
    return { valid: false, reason: 'Invalid security key' };
  }

  return { valid: true };
}

/**
 * Fallback credential validator using constant-time comparison on fixed 32-byte SHA-256 buffers.
 * Never leaks password length.
 */
export function validateCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;

  const userMatch = username.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase();
  
  // Hash both with SHA-256 to ensure exactly 32 bytes for timingSafeEqual
  const inputHash = sha256Hash(password);
  const correctHash = sha256Hash(ADMIN_PASSWORD);

  const passMatch = crypto.timingSafeEqual(inputHash, correctHash);
  return userMatch && passMatch;
}

/**
 * Server-side helper to check if current request has valid session cookie.
 */
export function getCurrentSession(): AuthSession | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
