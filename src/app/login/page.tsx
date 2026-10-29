'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

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
  return text;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('from') || '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Background cryptographic handshake state
  const [challengeState, setChallengeState] = useState<SecurityChallengeState | null>(null);

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/login', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setChallengeState({
          challenge: data.challenge,
          timestamp: data.timestamp,
          signature: data.signature,
        });
      }
    } catch {
      // Handled during submission
    }
  }, []);

  // Auto-logout on entrance: purges lingering sessions & clears storage
  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' }).catch(() => {});
    try {
      sessionStorage.clear();
      localStorage.removeItem('tochi_session_hint');
    } catch {}
    fetchChallenge();
  }, [fetchChallenge]);

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
        const passHash = await computeSha256(password);
        const clientHash = await computeSha256(`${passHash}:${challengeState.challenge}:${challengeState.timestamp}`);

        payload = {
          username: username.trim(),
          clientHash,
          challenge: challengeState.challenge,
          timestamp: challengeState.timestamp,
          signature: challengeState.signature,
        };
      } else {
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
        fetchChallenge();
        throw new Error(data.error || 'Invalid credentials');
      }

      setPassword('');
      setUsername('');

      router.push(redirectTarget);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF6F0] rounded-3xl border border-[#E7DFD3] p-8 sm:p-12 shadow-2xl max-w-sm w-full mx-auto">
      {/* Big Logo */}
      <div className="flex justify-center mb-8">
        <Image
          src="/assets/tochi-logo.png"
          alt="Tochi Labs"
          width={220}
          height={75}
          priority
          className="h-16 sm:h-20 w-auto object-contain"
        />
      </div>

      {/* Clean Error Message */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-rose-100/80 border border-rose-300 text-xs text-rose-900 flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" />
          <span className="leading-tight">{errorMessage}</span>
        </div>
      )}

      {/* Clean Login Form */}
      <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-[#541228] mb-1.5 uppercase tracking-wide">
            Username
          </label>
          <input
            type="text"
            required
            autoFocus
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full bg-white border border-[#E7DFD3] focus:border-[#541228] focus:ring-1 focus:ring-[#541228] rounded-xl px-4 py-3 text-sm text-[#1C181B] outline-none transition-all placeholder:text-[#9E959B]"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-[#541228] mb-1.5 uppercase tracking-wide">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white border border-[#E7DFD3] focus:border-[#541228] focus:ring-1 focus:ring-[#541228] rounded-xl pl-4 pr-11 py-3 text-sm text-[#1C181B] outline-none transition-all placeholder:text-[#9E959B]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E959B] hover:text-[#541228] transition-colors p-1"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Log In Button */}
        <button
          type="submit"
          disabled={isLoading || !username.trim() || !password}
          className="w-full mt-2 bg-[#541228] hover:bg-[#6B1733] text-white rounded-xl py-3.5 px-4 font-semibold text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#541228] flex items-center justify-center p-4 selection:bg-white/20 selection:text-white">
      <Suspense fallback={
        <div className="bg-[#FAF6F0] rounded-3xl border border-[#E7DFD3] p-12 text-center max-w-sm w-full mx-auto text-xs text-[#541228]">
          Loading...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
