'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes idle timeout

export const SessionGuard = () => {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performAutoLogout = async (reason = 'idle') => {
    try {
      sessionStorage.removeItem('tochi_auth_session');
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    } catch {}
    router.push(`/login?reason=${reason}`);
    router.refresh();
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => performAutoLogout('idle'), IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
    // 1. Re-login when browser tab was closed and re-opened:
    // sessionStorage is automatically wiped by the browser on tab closure, but survives page refresh.
    const isSessionActive = typeof window !== 'undefined' && sessionStorage.getItem('tochi_auth_session') === 'active';
    if (!isSessionActive) {
      performAutoLogout('reauth');
      return;
    }

    // 2. User activity monitor for 15-minute idle timeout
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, []);

  return null;
};

