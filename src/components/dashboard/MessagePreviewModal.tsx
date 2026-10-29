'use client';

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Fellow, TRACK_DETAILS } from '@/types/fellow';
import { EmailTemplateType, getEmailSubject, generateEmailHtml } from '@/lib/email/templates';

interface MessagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellow: Fellow | null;
  type: EmailTemplateType;
  onConfirmSend: (fellow: Fellow, type: EmailTemplateType) => Promise<void>;
}

export const MessagePreviewModal: React.FC<MessagePreviewModalProps> = ({
  isOpen,
  onClose,
  fellow,
  type,
  onConfirmSend,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !fellow) return null;

  const trackInfo = TRACK_DETAILS[fellow.track] || { label: fellow.track, shortLabel: fellow.track, code: 'DEV' };
  const subject = getEmailSubject(type, fellow);
  const htmlContent = generateEmailHtml(type, fellow, typeof window !== 'undefined' ? window.location.origin : 'https://tochidevstudio.in');

  const getModalTitle = () => {
    switch (type) {
      case 'WELCOME':
        return 'Preview & Dispatch Welcome Email';
      case 'SUBMISSION':
        return 'Preview & Dispatch Submission Link';
      case 'OFFER':
        return 'Preview & Dispatch Offer Letter';
      case 'CERTIFICATE':
        return 'Preview & Dispatch Certificate';
    }
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleSend = async () => {
    setIsSending(true);
    setErrorMsg(null);
    try {
      await onConfirmSend(fellow, type);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-tochi-border bg-white shadow-modal overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tochi-border bg-[#FAF6F0]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#541228] text-white flex items-center justify-center">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-tochi-text tracking-tight font-sans">
                {getModalTitle()}
              </h3>
              <p className="text-[11px] text-tochi-text-muted">
                Review email contents and recipient details before dispatching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-tochi-text-subtle hover:text-tochi-text hover:bg-white border border-transparent hover:border-tochi-border transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Recipient & Metadata Strip */}
        <div className="px-6 py-3.5 border-b border-tochi-border bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-tochi-text-muted tracking-wider block">
              Recipient
            </span>
            <span className="font-semibold text-tochi-text">{fellow.full_name}</span>
            <span className="text-tochi-text-muted text-[11px] block">{fellow.email}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-tochi-text-muted tracking-wider block">
              Student ID &amp; Track
            </span>
            <span className="font-mono font-semibold text-[#541228] bg-[#541228]/10 px-1.5 py-0.5 rounded text-[11px] inline-block mt-0.5">
              {fellow.student_id}
            </span>
            <span className="text-tochi-text-muted text-[11px] block mt-0.5">{trackInfo.label}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-tochi-text-muted tracking-wider block">
              Internship Period
            </span>
            <span className="font-mono text-tochi-text text-[11px] block mt-0.5">
              {fellow.cohort_start_date} &rarr; {fellow.cohort_end_date}
            </span>
            <span className="text-emerald-700 text-[10px] font-medium block">4-Week Cohort</span>
          </div>
        </div>

        {/* Subject Line Preview */}
        <div className="px-6 py-3 border-b border-tochi-border bg-[#FAF6F0]/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-semibold text-tochi-text-muted shrink-0 text-[11px]">Subject:</span>
            <span className="font-mono text-tochi-text text-[11px] truncate bg-white px-2.5 py-1 rounded border border-tochi-border flex-1">
              {subject}
            </span>
          </div>
          <button
            onClick={handleCopySubject}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border border-tochi-border bg-white hover:bg-[#FAF6F0] text-tochi-text-muted hover:text-tochi-text shrink-0 transition-colors"
            title="Copy subject line"
          >
            {copiedSubject ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Email Body Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAF6F0]/30 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-tochi-text-muted flex items-center justify-between">
            <span>Email Body Preview</span>
            <span className="font-mono text-[10px] text-tochi-text-subtle">HTML Render</span>
          </div>

          <div 
            className="bg-white rounded-xl border border-tochi-border p-4 shadow-sm overflow-hidden text-sm"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {errorMsg && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-tochi-border bg-white flex items-center justify-between gap-3">
          <p className="text-[11px] text-tochi-text-muted font-mono hidden sm:block">
            Sender: tochi.devstudio@gmail.com (Official Gmail SMTP Engine)
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-tochi-text hover:bg-[#FAF6F0] border border-tochi-border transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all shadow-burgundy active:scale-95 disabled:opacity-50"
            >
              <Send className={`h-3.5 w-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'Dispatching...' : 'Send Email Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

