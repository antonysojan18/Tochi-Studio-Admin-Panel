'use client';

import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  UploadCloud
} from 'lucide-react';

interface SyncSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const SAMPLE_CSV = `Full Name,Email,WhatsApp,College,Track,Degree,Year
Vikramaditya Rao,vikram.rao@example.com,+919876501234,IIT Bombay,AI_WEB_DEV,B.Tech Computer Science,4th Year
Meera Krishnan,meera.k@example.com,+919845012345,BITS Pilani,GEN_UIUX,B.Des Interaction Design,3rd Year
Siddharth Varma,siddharth.v@example.com,+919933012345,NIT Trichy,AUTOMATION,B.Tech ECE,4th Year
Priyanka Chopra,priyanka.c@example.com,+919711012345,Delhi Technological University,FULL_STACK,B.Tech IT,3rd Year
Kabir Joshi,kabir.j@example.com,+919655012345,IIIT Bangalore,ML_AI,M.Tech AI,2nd Year`;

export const SyncSheetModal: React.FC<SyncSheetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [isUsingRawCsv, setIsUsingRawCsv] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const payload = isUsingRawCsv
        ? { csvContent }
        : { sheetUrl };

      const res = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync spreadsheet');
      }

      setStatusMessage({
        type: 'success',
        text: `Successfully ingested ${data.insertedCount} new candidate(s).`,
        details: data.skippedCount > 0 
          ? `(${data.skippedCount} duplicate email(s) were automatically skipped)`
          : undefined,
      });

      await onSuccess();

      setTimeout(() => {
        onClose();
        setStatusMessage(null);
        setSheetUrl('');
        setCsvContent('');
      }, 1800);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error syncing data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setIsUsingRawCsv(true);
    setCsvContent(SAMPLE_CSV);
    setStatusMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-tochi-border bg-white p-6 shadow-modal">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-tochi-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#FAF6F0] border border-tochi-border flex items-center justify-center text-[#541228]">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-tochi-text font-sans">Sync Google Sheet / Ingestion</h2>
              <p className="text-xs text-tochi-text-muted">
                Batch ingest candidates from Google Sheets or Forms CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-tochi-text-subtle hover:text-tochi-text p-1.5 rounded-lg hover:bg-[#FAF6F0] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-2 mt-4 text-xs">
          <button
            onClick={() => setIsUsingRawCsv(false)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              !isUsingRawCsv 
                ? 'bg-[#541228] text-white font-semibold shadow-sm' 
                : 'text-tochi-text-muted hover:text-tochi-text hover:bg-[#FAF6F0]'
            }`}
          >
            Google Sheet URL
          </button>
          <button
            onClick={() => setIsUsingRawCsv(true)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              isUsingRawCsv 
                ? 'bg-[#541228] text-white font-semibold shadow-sm' 
                : 'text-tochi-text-muted hover:text-tochi-text hover:bg-[#FAF6F0]'
            }`}
          >
            Direct CSV Text
          </button>

          <button
            onClick={handleLoadSample}
            className="ml-auto text-[11px] text-[#541228] font-medium hover:underline"
          >
            Load Sample Batch
          </button>
        </div>

        {/* Inputs */}
        <div className="mt-4">
          {!isUsingRawCsv ? (
            <div>
              <label className="block text-xs font-semibold text-tochi-text-muted mb-1.5">
                Google Sheets Public CSV or Share URL:
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3.5 py-2.5 text-xs text-tochi-text placeholder:text-tochi-text-subtle outline-none font-mono"
              />
              <p className="text-[11px] text-tochi-text-subtle mt-1.5">
                Standard sheet share links are automatically converted to CSV export format.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-tochi-text-muted mb-1.5">
                Paste CSV Rows (with headers):
              </label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Full Name,Email,WhatsApp,College,Track..."
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg p-3 text-xs text-tochi-text placeholder:text-tochi-text-subtle outline-none font-mono resize-none"
              />
            </div>
          )}
        </div>

        {/* Column Mapping Info Pill */}
        <div className="mt-3.5 p-3 rounded-lg bg-[#FAF6F0] border border-tochi-border text-[11px] text-tochi-text-muted">
          <p className="font-semibold text-tochi-text mb-1">Column Normalization:</p>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
            <span className="bg-white px-2 py-0.5 rounded border border-tochi-border">Full Name</span>
            <span className="bg-white px-2 py-0.5 rounded border border-tochi-border">Email</span>
            <span className="bg-white px-2 py-0.5 rounded border border-tochi-border">WhatsApp / Phone</span>
            <span className="bg-white px-2 py-0.5 rounded border border-tochi-border">College</span>
            <span className="bg-white px-2 py-0.5 rounded border border-tochi-border">Track</span>
          </div>
          <p className="text-tochi-text-subtle mt-1.5 text-[10px]">
            Auto-assigns smart student IDs and prevents duplicate records by email address.
          </p>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div className={`mt-3.5 p-3 rounded-lg flex items-start gap-2.5 text-xs ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{statusMessage.text}</p>
              {statusMessage.details && (
                <p className="text-[11px] opacity-80 mt-0.5">{statusMessage.details}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-tochi-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-tochi-text-muted hover:text-tochi-text hover:bg-[#FAF6F0] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSync}
            disabled={isLoading || (!sheetUrl && !csvContent)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all shadow-burgundy active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Ingesting Candidates...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Run Ingestion Engine</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
