'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  KeyRound,
  RefreshCw,
  Cpu,
  Binary,
  CheckCircle2
} from 'lucide-react';

interface SecurityChallengeState {
  challenge: string;
  timestamp: number;
  signature: string;
}

/**
 * Computes native SHA-256 hex string using browser WebCrypto API.
 */
async function computeSha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder().encode(text);
    const hashBuf = await window.crypto.subtle.digest('SHA-256', enc);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback if WebCrypto is disabled
  return text;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('from') || '/dashboard';
  const reason = searchParams.get('reason');

  // Input fields start strictly blank for maximum security
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Security challenge state
  const [challengeState, setChallengeState] = useState<SecurityChallengeState | null>(null);
  const [isRefreshingChallenge, setIsRefreshingChallenge] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [autoLogoutNotice, setAutoLogoutNotice] = useState<string | null>(null);

  // 1. Fetch a fresh cryptographic challenge handshake from the server
  const fetchChallenge = useCallback(async () => {
    setIsRefreshingChallenge(true);
    try {
      const res = await fetch('/api/auth/login', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setChallengeState({
          challenge: data.challenge,
          timestamp: data.timestamp,
          signature: data.signature,
        });
        setSecondsRemaining(90);
      }
    } catch {
      // Challenge fetch error will be caught during submission
    } finally {
      setIsRefreshingChallenge(false);
    }
  }, []);

  // 2. Auto-logout on entrance: Immediately invalidate any lingering sessions
  useEffect(() => {
    let isMounted = true;

    // Purge cookies on entrance
    fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' })
      .then(() => {
        if (isMounted) {
          setAutoLogoutNotice('Prior session purged. Secure channel established.');
        }
      })
      .catch(() => {});

    // Clear client-side cached storage
    try {
      sessionStorage.clear();
      localStorage.removeItem('tochi_session_hint');
    } catch {}

    // Initialize fresh cryptographic challenge
    fetchChallenge();

    return () => {
      isMounted = false;
    };
  }, [fetchChallenge]);

  // 3. Challenge timer: Refresh handshake when expiration nears
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          fetchChallenge();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchChallenge]);

  // 4. Handle encrypted authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let payload: Record<string, any> = {
        username: username.trim(),
      };

      // Client-side SHA-256 WebCrypto Challenge-Hashed Encryption
      if (challengeState && typeof window !== 'undefined' && window.crypto?.subtle) {
        // Step A: Hash the password locally
        const passHash = await computeSha256(password);
        // Step B: Salt with the ephemeral server challenge nonce + timestamp
        const clientHash = await computeSha256(`${passHash}:${challengeState.challenge}:${challengeState.timestamp}`);

        payload = {
          username: username.trim(),
          clientHash,
          challenge: challengeState.challenge,
          timestamp: challengeState.timestamp,
          signature: challengeState.signature,
        };
      } else {
        // Fallback if challenge is not yet resolved
        payload = {
          username: username.trim(),
          password: password,
        };
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        // Immediately cycle challenge on failed attempt
        fetchChallenge();
        throw new Error(data.error || 'Authentication rejected by security subsystem.');
      }

      // Security hygiene: clear input fields in state
      setPassword('');
      setUsername('');

      // Navigate to destination
      router.push(redirectTarget);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with security node.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-tochi-border p-7 sm:p-10 shadow-card max-w-md w-full relative overflow-hidden">
      {/* Top Burgundy Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#541228]" />

      {/* Uploaded TOCHI /LABS Official Logo */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Image
            src="/assets/tochi-logo.png"
            alt="Tochi .dev Studio Logo"
            width={160}
            height={50}
            priority
            className="h-12 sm:h-14 w-auto object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-tochi-text font-sans">
          Operator Terminal
        </h1>
        <p className="text-xs text-tochi-text-muted mt-1.5 font-sans">
          Internal Operations &amp; Internship Credential Engine
        </p>
      </div>

      {/* Auto-Logout / Security Status Notice */}
      <div className="mb-4 p-2.5 rounded-xl bg-[#FAF6F0] border border-tochi-border flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Auto-Logout Enforced</span>
        </div>
        <div className="flex items-center gap-1 text-tochi-text-subtle text-[10px]">
          <span>E2E SHA-256</span>
        </div>
      </div>

      {/* Reason Pill if redirected from idle session */}
      {reason === 'idle' && (
        <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Session locked due to inactivity. Re-authentication required.</span>
        </div>
      )}

      {/* Ephemeral Challenge Token Ribbon */}
      <div className="mb-5 p-2 rounded-lg bg-[#FAF6F0]/80 border border-tochi-border/80 flex items-center justify-between text-[10px] font-mono text-tochi-text-muted">
        <div className="flex items-center gap-1.5 truncate">
          <Cpu className="h-3 w-3 text-[#541228] shrink-0" />
          <span className="truncate">
            NONCE: {challengeState?.challenge ? `${challengeState.challenge.slice(0, 10)}...` : 'Generating...'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-tochi-text-subtle font-semibold">
            {secondsRemaining}s
          </span>
          <button
            type="button"
            onClick={fetchChallenge}
            disabled={isRefreshingChallenge}
            className="p-1 hover:text-[#541228] text-tochi-text-subtle transition-colors rounded"
            title="Refresh Cryptographic Handshake"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshingChallenge ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message with Attempts Counter */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block">{errorMessage}</span>
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <span className="text-[11px] text-rose-700 block mt-1 font-mono">
                Security Lockout in {remainingAttempts} failed attempt(s).
              </span>
            )}
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
        {/* Username Input */}
        <div>
          <label className="block text-xs font-semibold text-tochi-text-muted uppercase tracking-wider mb-1.5">
            Admin Identity
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-tochi-text-subtle" />
            <input
              type="text"
              required
              autoFocus
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Admin ID"
              className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-tochi-text outline-none transition-all font-mono"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-tochi-text-muted uppercase tracking-wider">
              Security Key
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-tochi-text-subtle hover:text-[#541228] flex items-center gap-1 transition-colors"
            >
              {showPassword ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-tochi-text-subtle" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Security Key"
              className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-tochi-text outline-none transition-all font-mono"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !username.trim() || !password}
          className="w-full mt-3 bg-[#541228] hover:bg-[#6B1733] text-white rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 shadow-burgundy transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying Encrypted Handshake...</span>
            </>
          ) : (
            <>
              <span>Authorize &amp; Enter Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Security Assurance Footnote */}
      <div className="mt-6 pt-4 border-t border-tochi-border text-center">
        <p className="text-[10px] text-tochi-text-subtle font-mono">
          Client-Hashed WebCrypto &bull; Anti-Replay Nonce &bull; Max 5 Attempts per IP
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-tochi-canvas flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-[#541228]/15 selection:text-[#541228]">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/tochi-logo.png"
            alt="Tochi Logo"
            width={110}
            height={36}
            className="h-8 w-auto object-contain"
          />
          <div>
            <span className="font-mono text-xs font-bold text-tochi-text tracking-tight block">
              Tochi <span className="font-sans font-normal text-tochi-text-muted">.dev Studio</span>
            </span>
            <span className="text-[10px] font-mono text-tochi-text-subtle block">
              SECURE OPERATOR PORTAL
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-[#541228]/5 border border-[#541228]/15 text-[#541228]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Encrypted Terminal</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex items-center justify-center my-auto py-8">
        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-tochi-border p-12 text-center shadow-card font-mono text-xs text-tochi-text-muted">
            Initializing security subsystem...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between py-3 border-t border-tochi-border/70 text-xs text-tochi-text-subtle gap-2 font-mono">
        <div>&copy; 2026 Tochi .dev Studio. All rights reserved.</div>
        <div className="flex items-center gap-3">
          <span>Antony Sojan, Founder</span>
          <span>&bull;</span>
          <span>MSME Registered</span>
        </div>
      </footer>
    </div>
  );
}
