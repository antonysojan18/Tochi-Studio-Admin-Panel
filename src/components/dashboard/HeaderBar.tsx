'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Search, 
  FileSpreadsheet, 
  UserPlus, 
  Users, 
  Flame, 
  FileCheck2, 
  Award, 
  LogOut,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fellow } from '@/types/fellow';

interface HeaderBarProps {
  fellows: Fellow[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSyncModal: () => void;
  onOpenAddModal: () => void;
  isSupabaseLive?: boolean;
  onSyncSuccess?: () => Promise<void>;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  fellows,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onSyncSuccess,
}) => {
  const router = useRouter();
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time stats
  const total = fellows.length;
  const inSprint = fellows.filter(f => f.status === 'IN_SPRINT').length;
  const submitted = fellows.filter(f => f.status === 'SUBMITTED').length;
  const certified = fellows.filter(f => f.status === 'CERTIFIED').length;

  // Universal Google Sheet URL state with persistent localStorage caching
  const [sheetUrl, setSheetUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tochi_google_sheet_url') || '';
    }
    return '';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Manual Trigger: Pull candidates right now from Google Sheet
  const handleSyncNow = async () => {
    if (!sheetUrl.trim()) {
      sheetInputRef.current?.focus();
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tochi_google_sheet_url', sheetUrl.trim());
      }

      // 1. Immediately persist URL universally to backend
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'google_sheet_url', value: sheetUrl.trim() }),
      });

      // 2. Fetch and ingest new candidates
      const res = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync Google Sheet');
      }

      if (onSyncSuccess) {
        await onSyncSuccess();
      }

      if (data.insertedCount > 0 && data.updatedCount > 0) {
        setSyncFeedback({
          type: 'success',
          text: `Pulled ${data.insertedCount} new, updated ${data.updatedCount} candidates!`,
        });
      } else if (data.insertedCount > 0) {
        setSyncFeedback({
          type: 'success',
          text: `Pulled ${data.insertedCount} new candidate${data.insertedCount > 1 ? 's' : ''}!`,
        });
      } else if (data.updatedCount > 0) {
        setSyncFeedback({
          type: 'success',
          text: `Updated ${data.updatedCount} candidate track/profile record${data.updatedCount > 1 ? 's' : ''}!`,
        });
      } else {
        setSyncFeedback({
          type: 'success',
          text: `All candidates up to date (${data.totalRows || 0} rows found)`,
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: err.message || 'Sync failed. Check sheet link and sharing permissions.',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 5000);
    }
  };

  // 1. Load universal Google Sheet URL on mount across all devices & auto-heal cold start
  useEffect(() => {
    let cachedUrl = '';
    if (typeof window !== 'undefined') {
      cachedUrl = localStorage.getItem('tochi_google_sheet_url') || '';
      if (cachedUrl) {
        setSheetUrl(cachedUrl);
      }
    }

    fetch('/api/settings?key=google_sheet_url')
      .then(res => res.json())
      .then(async data => {
        if (data.success && typeof data.value === 'string' && data.value.trim()) {
          const remoteUrl = data.value.trim();
          setSheetUrl(remoteUrl);
          if (typeof window !== 'undefined') {
            localStorage.setItem('tochi_google_sheet_url', remoteUrl);
          }
        } else if (cachedUrl) {
          // Server restarted or empty; re-persist client URL to backend
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'google_sheet_url', value: cachedUrl }),
          });
          // And automatically trigger background ingestion to populate dashboard
          await fetch('/api/sync-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheetUrl: cachedUrl }),
          });
          if (onSyncSuccess) await onSyncSuccess();
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
      try {
        sessionStorage.clear();
        localStorage.removeItem('tochi_session_hint');
      } catch {}
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  // 2. Auto-save sheet URL universally to backend database & trigger initial background ingestion
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setSheetUrl(nextVal);
    if (typeof window !== 'undefined') {
      if (nextVal.trim()) {
        localStorage.setItem('tochi_google_sheet_url', nextVal.trim());
      } else {
        localStorage.removeItem('tochi_google_sheet_url');
      }
    }

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = setTimeout(async () => {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'google_sheet_url', value: nextVal.trim() }),
        });

        // Trigger immediate background sync
        if (nextVal.trim()) {
          const syncRes = await fetch('/api/sync-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheetUrl: nextVal.trim() }),
          });
          const syncData = await syncRes.json();
          if (syncData.success && syncData.insertedCount > 0 && onSyncSuccess) {
            await onSyncSuccess();
          }
        }
      } catch {
        // Silent background execution
      }
    }, 600);
  };

  // 3. Clear button: Clears the input and purges URL from database universally
  const handleClearUrl = async () => {
    setSheetUrl('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tochi_google_sheet_url');
    }
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'google_sheet_url', value: '' }),
      });
    } catch {}
  };

  return (
    <header className="w-full border-b border-[#3B0D1C] bg-[#541228] text-[#FAF6F0] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top Level: Brand, Universal Search, and Add Student / Logout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Brand with Official Uploaded Logo */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center bg-[#3B0D1C]/80 border border-white/20 rounded-xl px-3 py-1.5 shadow-inner">
              <Image
                src="/assets/tochi-logo-light.png"
                alt="Tochi Labs Official Logo"
                width={160}
                height={62}
                priority
                className="h-11 sm:h-12 w-auto object-contain"
              />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#FAF6F0] font-mono leading-tight">
                Tochi <span className="text-[#FAF6F0]/85 font-sans font-semibold">.dev Studio</span>
              </h1>
              <p className="text-[11px] text-[#FAF6F0]/70 font-sans mt-0.5">
                Internship Operations &amp; Certificate Automation Engine
              </p>
            </div>
          </div>

          {/* Middle: Universal Search */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#FAF6F0]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search students by Name, Email, or Student ID..."
                className="w-full bg-[#3B0D1C]/80 border border-white/20 focus:border-white/50 focus:bg-[#3B0D1C] rounded-lg pl-9 pr-10 py-1.5 text-xs text-[#FAF6F0] placeholder:text-[#FAF6F0]/50 outline-none transition-all shadow-inner font-sans"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#FAF6F0]/70 bg-white/10 rounded border border-white/20">
                /
              </kbd>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FAF6F0] hover:bg-white text-[#541228] transition-all shadow-md active:scale-95"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Student</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#FAF6F0]/80 hover:text-white hover:bg-white/15 border border-white/20 transition-all shadow-sm"
              title="Sign Out of Admin OS"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-3 border-t border-white/15">
          {/* Stat 1: Total Students */}
          <div 
            onClick={() => sheetInputRef.current?.focus()}
            className="bg-[#3B0D1C]/80 hover:bg-[#3B0D1C] border border-white/25 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
            title="Focus Google Sheet URL below"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FAF6F0]/80">Total Students</p>
              <p className="text-xl font-bold font-mono text-[#FAF6F0] mt-0.5">{total}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-white/10 border border-white/15 flex items-center justify-center text-[#FAF6F0] group-hover:bg-white group-hover:text-[#541228] transition-colors">
              <Users className="h-4 w-4" />
            </div>
          </div>

          {/* Stat 2: In Internship */}
          <div className="bg-[#1E3A8A]/35 border border-blue-400/30 rounded-lg p-3 flex items-center justify-between text-blue-100">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">In Internship</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">{inSprint}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Flame className="h-4 w-4" />
            </div>
          </div>

          {/* Stat 3: Submissions */}
          <div className="bg-[#581C87]/35 border border-purple-400/30 rounded-lg p-3 flex items-center justify-between text-purple-100">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">For Review</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">{submitted}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>

          {/* Stat 4: Certified */}
          <div className="bg-[#064E3B]/35 border border-emerald-400/30 rounded-lg p-3 flex items-center justify-between text-emerald-100">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">Certified</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">{certified}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Award className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Google Sheet Live Strip with Sync Now Button & 30-Second Refresh Indicator */}
        <div className="mt-3 pt-3 border-t border-white/15">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Input Link Box */}
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-[#FAF6F0]/70">
                <FileSpreadsheet className="h-4 w-4 text-[#FAF6F0]" />
                <span className="text-[11px] font-mono font-medium hidden sm:inline text-[#FAF6F0]/80">Google Sheet:</span>
              </div>
              <input
                ref={sheetInputRef}
                type="url"
                value={sheetUrl}
                onChange={handleUrlChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSyncNow();
                  }
                }}
                placeholder="Paste Google Sheets Public CSV or Share URL (e.g. https://docs.google.com/spreadsheets/d/...)"
                className="w-full bg-[#3B0D1C]/80 border border-white/20 focus:border-white/60 focus:bg-[#3B0D1C] rounded-xl pl-10 sm:pl-36 pr-10 py-2.5 text-xs text-[#FAF6F0] placeholder:text-[#FAF6F0]/40 outline-none transition-all font-mono shadow-inner"
              />
              {sheetUrl && (
                <button
                  type="button"
                  onClick={handleClearUrl}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FAF6F0]/60 hover:text-white p-1 rounded transition-colors"
                  title="Clear Google Sheet URL"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sync Now Button */}
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || !sheetUrl.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FAF6F0] hover:bg-white text-[#541228] transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                title="Immediately pull new candidates from the Google Sheet"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>

          {/* Sync Feedback Message */}
          {syncFeedback && (
            <div className="mt-2 flex items-center gap-2 text-xs font-mono">
              {syncFeedback.type === 'success' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{syncFeedback.text}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 border border-rose-400/30">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{syncFeedback.text}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
