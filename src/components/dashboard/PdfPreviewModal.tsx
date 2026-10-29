'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Send, 
  CheckCircle2, 
  FileText, 
  Award, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Fellow } from '@/types/fellow';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellow: Fellow | null;
  type: 'OFFER';
  onEmailSent?: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  fellow,
  type,
  onEmailSent,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    mocked?: boolean;
    error?: string;
  } | null>(null);

  if (!isOpen || !fellow) return null;

  const pdfUrl = `/api/pdf/offer-letter/${fellow.id}`;
  const title = 'Offer Letter';

  const handleSendEmail = async () => {
    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fellowId: fellow.id,
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      setSendResult({
        success: true,
        mocked: data.mocked,
      });

      if (onEmailSent) {
        onEmailSent();
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        error: err.message || 'Error sending email',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl border border-tochi-border bg-white shadow-modal overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-tochi-border bg-[#FAF6F0]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#541228] text-white flex items-center justify-center shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-tochi-text font-sans">
                  {title} &bull; <span className="font-mono text-[#541228]">{fellow.student_id}</span>
                </h2>
                <span className="text-xs text-tochi-text-muted font-normal">({fellow.full_name})</span>
              </div>
              <p className="text-[11px] text-tochi-text-subtle font-mono">
                Official Letterhead &bull; Antony Sojan, Founder &bull; MSME Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Raw Tab */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#FAF6F0] text-tochi-text border border-tochi-border transition-all shadow-card"
              title="Open PDF in new browser tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            {/* Download Link */}
            <a
              href={pdfUrl}
              download={`Offer_Letter_${fellow.student_id}.pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#FAF6F0] text-tochi-text border border-tochi-border transition-all shadow-card"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>

            {/* Dispatch Email */}
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#541228] hover:bg-[#6B1733] transition-all shadow-burgundy active:scale-95 disabled:opacity-50"
            >
              <Send className={`h-3.5 w-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'Dispatching...' : 'Dispatch to Candidate'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-tochi-text-subtle hover:text-tochi-text hover:bg-white rounded-lg transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert if Email Dispatched */}
        {sendResult && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
            sendResult.success 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              {sendResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <X className="h-4 w-4 text-amber-600" />
              )}
              <span>
                {sendResult.success 
                  ? sendResult.mocked
                    ? `Offer Letter simulation dispatch recorded for ${fellow.email}`
                    : `Offer Letter PDF successfully dispatched to ${fellow.email}`
                  : sendResult.error}
              </span>
            </div>
            <button 
              onClick={() => setSendResult(null)}
              className="text-tochi-text-subtle hover:text-tochi-text text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* PDF Viewer Iframe */}
        <div className="flex-1 bg-stone-100 p-2 sm:p-4 overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className="w-full h-full rounded-xl border border-tochi-border shadow-inner bg-white"
            title={`Preview of Offer Letter for ${fellow.full_name}`}
          />
        </div>

        {/* Modal Footer Info */}
        <div className="px-6 py-2.5 border-t border-tochi-border bg-white flex items-center justify-between text-[11px] text-tochi-text-muted font-mono">
          <div>
            Recipient: <span className="text-tochi-text font-semibold">{fellow.email}</span>
          </div>
          <div>
            Tamper-Proof Verification Hash: <span className="text-[#541228] font-bold">{fellow.qr_verify_hash.slice(0, 16)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
