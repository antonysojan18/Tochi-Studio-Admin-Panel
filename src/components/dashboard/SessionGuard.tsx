'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes idle timeout

export const SessionGuard = () => {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performAutoLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    } catch {}
    router.push('/login?reason=idle');
    router.refresh();
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(performAutoLogout, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
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

