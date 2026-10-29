'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { 
  Search, 
  FileSpreadsheet, 
  UserPlus, 
  ShieldCheck, 
  Users, 
  Flame, 
  FileCheck2, 
  Award,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
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

const SAMPLE_CSV = `Full Name,Email,WhatsApp,College,Track,Degree,Year
Vikramaditya Rao,vikram.rao@example.com,+919876501234,IIT Bombay,AI_WEB_DEV,B.Tech Computer Science,4th Year
Meera Krishnan,meera.k@example.com,+919845012345,BITS Pilani,GEN_UIUX,B.Des Interaction Design,3rd Year
Siddharth Varma,siddharth.v@example.com,+919933012345,NIT Trichy,AUTOMATION,B.Tech ECE,4th Year`;

export const HeaderBar: React.FC<HeaderBarProps> = ({
  fellows,
  searchQuery,
  onSearchChange,
  onOpenSyncModal,
  onOpenAddModal,
  isSupabaseLive = true,
  onSyncSuccess,
}) => {
  const router = useRouter();
  const sheetInputRef = useRef<HTMLInputElement>(null);

  // Real-time stats
  const total = fellows.length;
  const inSprint = fellows.filter(f => f.status === 'IN_SPRINT').length;
  const submitted = fellows.filter(f => f.status === 'SUBMITTED').length;
  const certified = fellows.filter(f => f.status === 'CERTIFIED').length;

  // Inline Google Sheets Sync State
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRawCsv, setShowRawCsv] = useState(false);
  const [rawCsvContent, setRawCsvContent] = useState('');
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: string;
  } | null>(null);

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

  const handleInlineSync = async () => {
    if (!sheetUrl.trim() && !rawCsvContent.trim()) {
      sheetInputRef.current?.focus();
      setSyncStatus({
        type: 'error',
        text: 'Please paste a Google Sheets public URL or enter CSV data',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const payload = showRawCsv && rawCsvContent.trim()
        ? { csvContent: rawCsvContent.trim() }
        : { sheetUrl: sheetUrl.trim() };

      const res = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync Google Sheet');
      }

      setSyncStatus({
        type: 'success',
        text: `Ingested ${data.insertedCount} new student(s).`,
        details: data.skippedCount > 0 
          ? `(${data.skippedCount} duplicate email(s) skipped)`
          : undefined,
      });

      if (onSyncSuccess) {
        await onSyncSuccess();
      }

      if (!showRawCsv) {
        setSheetUrl('');
      } else {
        setRawCsvContent('');
      }

      setTimeout(() => {
        setSyncStatus(null);
      }, 5000);
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        text: err.message || 'Error syncing Google Sheet',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadSample = () => {
    setShowRawCsv(true);
    setRawCsvContent(SAMPLE_CSV);
    setSyncStatus(null);
  };

  return (
    <header className="w-full border-b border-[#3B0D1C] bg-[#541228] text-[#FAF6F0] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top Level: Brand, Search, and Main Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Brand with Official Uploaded Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-[#3B0D1C]/60 border border-white/15 rounded-lg px-2 py-1 shadow-inner">
              <Image
                src="/assets/tochi-logo-light.png"
                alt="Tochi Labs Official Logo"
                width={110}
                height={34}
                priority
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#FAF6F0] font-mono">
                Tochi <span className="text-[#FAF6F0]/80 font-sans font-semibold">.dev Studio</span>
              </h1>
              <p className="text-[11px] text-[#FAF6F0]/70 font-sans">
                Internship Operations &amp; Certificate Automation Engine
              </p>
            </div>
          </div>

          {/* Middle: Universal Search (Styled for Burgundy Background) */}
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

          {/* Right: Quick Action Buttons (High Contrast on Burgundy) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FAF6F0] hover:bg-white text-[#541228] transition-all shadow-md active:scale-95"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Student</span>
            </button>

            <Link
              href="/verify"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#FAF6F0] hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all shadow-sm"
              title="Open Public Verification Portal"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Verify</span>
            </Link>

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

        {/* Quick Stats Grid ("Tabs" on Burgundy Base) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-3 border-t border-white/15">
          {/* Stat 1: Total Students (Clickable to focus sync input) */}
          <div 
            onClick={() => sheetInputRef.current?.focus()}
            className="bg-[#3B0D1C]/80 hover:bg-[#3B0D1C] border border-white/25 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
            title="Click to paste Google Sheet URL below"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FAF6F0]/80">Total Students</p>
                <span className="text-[9px] font-mono text-[#FAF6F0] bg-white/20 px-1.5 py-0.2 rounded group-hover:bg-white group-hover:text-[#541228] transition-colors">
                  Sheet Sync
                </span>
              </div>
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

        {/* Google Sheets Public CSV or Share URL Section (Directly Under Total Students Tab) */}
        <div className="mt-3 pt-3 border-t border-white/15 bg-white text-tochi-text rounded-xl p-3 sm:p-3.5 border border-tochi-border shadow-elevated">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-[#541228]/10 text-[#541228] flex items-center justify-center">
                <FileSpreadsheet className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-tochi-text tracking-tight">
                  Google Sheets Public CSV or Share URL
                </span>
                <span className="hidden sm:inline text-[11px] text-tochi-text-muted ml-2">
                  (Under Total Students Ingestion Node)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[11px] font-mono text-[#541228] hover:underline"
              >
                Load Sample CSV
              </button>
              <span className="text-tochi-text-subtle">|</span>
              <button
                type="button"
                onClick={() => setShowRawCsv(!showRawCsv)}
                className="text-[11px] text-tochi-text-muted hover:text-tochi-text inline-flex items-center gap-1"
              >
                <span>{showRawCsv ? 'Use Sheet Link' : 'Paste Raw CSV'}</span>
                {showRawCsv ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {!showRawCsv ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tochi-text-subtle" />
                <input
                  ref={sheetInputRef}
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInlineSync();
                    }
                  }}
                  placeholder="Paste Google Sheets Public CSV or Share URL (e.g. https://docs.google.com/spreadsheets/d/...)"
                  className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg pl-9 pr-4 py-2 text-xs text-tochi-text placeholder:text-tochi-text-subtle outline-none transition-all font-mono shadow-sm"
                />
              </div>

              <button
                type="button"
                onClick={handleInlineSync}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all shadow-burgundy active:scale-95 disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Students'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={rawCsvContent}
                onChange={(e) => setRawCsvContent(e.target.value)}
                placeholder="Full Name,Email,WhatsApp,College,Track,Degree,Year&#10;Aarav Sharma,aarav@example.com,+919876543210,IIT Madras,AI_WEB_DEV,B.Tech,3rd Year"
                rows={3}
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg p-2.5 text-xs text-tochi-text placeholder:text-tochi-text-subtle outline-none transition-all font-mono shadow-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-tochi-text-subtle font-mono">
                  Format: Full Name, Email, WhatsApp, College, Track, Degree, Year
                </span>
                <button
                  type="button"
                  onClick={handleInlineSync}
                  disabled={isSyncing || !rawCsvContent.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all shadow-burgundy active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Ingesting...' : 'Ingest Raw CSV'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback & Helper Text */}
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
            {syncStatus ? (
              <div className={`flex items-center gap-1.5 ${
                syncStatus.type === 'success' ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {syncStatus.type === 'success' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                )}
                <span className="font-medium">{syncStatus.text}</span>
                {syncStatus.details && (
                  <span className="text-tochi-text-muted">{syncStatus.details}</span>
                )}
              </div>
            ) : (
              <div className="text-tochi-text-subtle text-[10px] font-mono flex items-center gap-2 flex-wrap">
                <span>• Auto-maps Full Name, Email, WhatsApp, Track &amp; College</span>
                <span>• Assigns Smart Student IDs (TCL-26Q4)</span>
                <span>• Duplicate emails are automatically preserved without overwrite</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
