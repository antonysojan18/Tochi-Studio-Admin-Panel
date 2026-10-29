'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Search, 
  Award, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Terminal,
  FileText
} from 'lucide-react';
import { TRACK_DETAILS, STATUS_DETAILS } from '@/types/fellow';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('hash') || searchParams.get('id') || '';

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [record, setRecord] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performLookup = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/verify?hash=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setRecord(null);
        setErrorMessage(data.error || 'Record could not be verified in the Tochi .dev Studio registry.');
      } else {
        setRecord(data.data);
      }
    } catch (err: any) {
      setRecord(null);
      setErrorMessage(err.message || 'Error communicating with verification node.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performLookup(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(inputQuery);
  };

  const trackMeta = record?.track ? TRACK_DETAILS[record.track as keyof typeof TRACK_DETAILS] : null;
  const statusMeta = record?.status ? STATUS_DETAILS[record.status as keyof typeof STATUS_DETAILS] : null;

  return (
    <div className="min-h-screen bg-tochi-canvas text-tochi-text flex flex-col justify-between selection:bg-[#541228]/15 selection:text-[#541228]">
      {/* Top Navbar */}
      <nav className="w-full border-b border-tochi-border bg-[#FAF6F0]/90 backdrop-blur-md py-3.5 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#541228] text-white flex items-center justify-center shadow-sm">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-mono tracking-tight text-tochi-text">
              Tochi <span className="font-sans text-tochi-text-muted">.dev Studio</span>
            </h1>
            <p className="text-[10px] font-mono text-tochi-text-subtle">
              PUBLIC INTERNSHIP REGISTRY
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-tochi-border bg-white hover:bg-[#FAF6F0] transition-colors shadow-card"
        >
          Admin OS &rarr;
        </Link>
      </nav>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 mb-3.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Cryptographic Verification Node Live</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-tochi-text font-sans">
            Verify Internship Credential
          </h2>
          <p className="text-xs sm:text-sm text-tochi-text-muted max-w-md mx-auto mt-1.5">
            Tamper-proof authenticity check for official Tochi .dev Studio offer letters and certificates.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-tochi-text-subtle" />
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Enter Student ID (e.g. TCL-26Q4-WEB-0001) or QR Hash..."
              className="w-full bg-white border border-tochi-border focus:border-[#541228] rounded-xl pl-11 pr-28 py-3 text-xs sm:text-sm text-tochi-text placeholder:text-tochi-text-subtle outline-none font-mono shadow-card transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="absolute right-1.5 px-4 py-2 rounded-lg bg-[#541228] hover:bg-[#6B1733] text-white font-semibold text-xs transition-all shadow-burgundy active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {/* Verification Result Card */}
        {record ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-elevated relative overflow-hidden animate-in fade-in duration-150">
            {/* Authenticity Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-tochi-border gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-700 uppercase">
                      Official Authenticity Verified
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-tochi-text mt-0.5">
                    {record.full_name}
                  </h3>
                </div>
              </div>

              <div className="font-mono text-xs sm:text-right">
                <div className="text-[10px] text-tochi-text-subtle">STUDENT ID:</div>
                <div className="text-sm font-bold text-[#541228]">{record.student_id}</div>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-tochi-border text-xs">
              <div>
                <span className="text-tochi-text-subtle block mb-1">INTERNSHIP DOMAIN:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${trackMeta?.badgeBg} ${trackMeta?.badgeText} ${trackMeta?.border}`}>
                  {trackMeta?.label || record.track}
                </span>
                <p className="text-[11px] text-tochi-text-muted mt-1">{trackMeta?.description}</p>
              </div>

              <div>
                <span className="text-tochi-text-subtle block mb-1">STATUS:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta?.bg} ${statusMeta?.text} ${statusMeta?.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusMeta?.dot}`} />
                  <span>{statusMeta?.label || record.status}</span>
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-tochi-text-muted font-mono text-[11px]">
                  <Calendar className="h-3.5 w-3.5 text-tochi-text-subtle" />
                  <span>{record.cohort_start_date} to {record.cohort_end_date}</span>
                </div>
              </div>
            </div>

            {/* MSME & Cryptographic Hash Footer */}
            <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-tochi-text-muted">
                  <Building2 className="h-3.5 w-3.5 text-[#541228]" />
                  <span>Issued by: <strong>Tochi .dev Studio</strong></span>
                </div>
                <div className="font-mono text-[11px] text-tochi-text-subtle">
                  Founder: <span className="text-tochi-text font-semibold">Antony Sojan</span> &bull; <span className="text-emerald-700 font-semibold">MSME Registered</span>
                </div>
                <div className="font-mono text-[10px] text-tochi-text-subtle truncate max-w-xs">
                  Hash: {record.qr_verify_hash}
                </div>
              </div>

              {/* Action Buttons to View PDFs */}
              <div className="flex items-center gap-2 flex-wrap">
                {record.has_certificate && (
                  <a
                    href={`/api/pdf/certificate/${record.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all shadow-burgundy"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>Certificate PDF</span>
                  </a>
                )}

                <a
                  href={`/api/pdf/offer-letter/${record.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF6F0] hover:bg-[#F3EDE2] text-tochi-text border border-tochi-border transition-all"
                >
                  <FileText className="h-3.5 w-3.5 text-[#541228]" />
                  <span>Offer Letter</span>
                </a>
              </div>
            </div>
          </div>
        ) : hasSearched && !isLoading ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center my-6">
            <AlertTriangle className="h-6 w-6 text-rose-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-rose-900">Verification Failed</h3>
            <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto">
              {errorMessage || 'No student record found matching that Student ID or Verification Hash.'}
            </p>
          </div>
        ) : null}

        {/* Security Assurance Info */}
        <div className="mt-10 p-4 rounded-xl border border-tochi-border bg-white text-xs text-tochi-text-muted flex items-start gap-3 shadow-card">
          <ShieldCheck className="h-4 w-4 text-[#541228] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-tochi-text">Verification Protocol:</p>
            <p className="leading-relaxed">
              Every document generated carries a cryptographic SHA-256 hash embedded into its vector layers and encoded within its QR code. Any modification voids cryptographic validity.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-tochi-border py-4 text-center text-xs text-tochi-text-subtle font-mono">
        Tochi .dev Studio // MSME Registered
      </footer>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF6F0] text-tochi-text flex items-center justify-center font-mono text-xs">
        Loading verification engine...
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
