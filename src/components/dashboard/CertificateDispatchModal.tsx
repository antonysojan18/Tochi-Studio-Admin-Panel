'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Award, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Send,
  Eye,
  Trash2
} from 'lucide-react';
import { Fellow, TRACK_DETAILS } from '@/types/fellow';

interface CertificateDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellow: Fellow | null;
  onSuccess: () => Promise<void>;
}

export const CertificateDispatchModal: React.FC<CertificateDispatchModalProps> = ({
  isOpen,
  onClose,
  fellow,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !fellow) return null;

  const trackInfo = TRACK_DETAILS[fellow.track] || { label: fellow.track, shortLabel: fellow.track, code: 'DEV' };
  const hasExistingCertificate = Boolean(
    fellow.certificate_url && 
    (fellow.certificate_url.includes('/uploads/certificates/') || fellow.status === 'CERTIFIED')
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setErrorMessage('Only PDF documents (.pdf) are permitted.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      setUploadSuccess(`Selected "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  const handleUploadAndDispatch = async () => {
    setIsDispatching(true);
    setErrorMessage(null);

    try {
      // 1. If a custom PDF file was chosen, upload it first
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch(`/api/fellows/${fellow.id}/upload-certificate`, {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload certificate PDF');
        }
        setIsUploading(false);
      }

      // 2. Dispatch the certificate email with the certificate attached
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fellowId: fellow.id,
          type: 'CERTIFICATE',
        }),
      });

      const emailData = await emailRes.json();
      if (!emailRes.ok || !emailData.success) {
        throw new Error(emailData.error || 'Failed to dispatch certificate email');
      }

      await onSuccess();
      setUploadSuccess('Certificate PDF successfully attached and dispatched to student!');
      
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setUploadSuccess(null);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error completing certificate dispatch');
    } finally {
      setIsUploading(false);
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-tochi-border bg-white shadow-modal overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tochi-border bg-[#FAF6F0]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#541228] text-white flex items-center justify-center shadow-sm">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-tochi-text tracking-tight font-sans">
                Issue Certificate of Internship Completion
              </h3>
              <p className="text-[11px] text-tochi-text-muted">
                Upload your authenticated certificate PDF and dispatch congratulatory notice
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

        {/* Candidate Info Ribbon */}
        <div className="px-6 py-3 border-b border-tochi-border bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-tochi-text-muted text-[10px] uppercase font-semibold tracking-wider block">
              Candidate
            </span>
            <span className="font-bold text-tochi-text">{fellow.full_name}</span>
            <span className="text-tochi-text-muted text-[11px] ml-2">({fellow.email})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#541228]/10 text-[#541228] border border-[#541228]/15">
              {fellow.student_id}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
              {trackInfo.shortLabel}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FAF6F0]/30">
          {/* Section 1: Certificate Congratulations Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-tochi-text-muted">
                1. Congratulatory Message Preview
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Official Letterhead
              </span>
            </div>

            <div className="bg-white rounded-xl border border-tochi-border p-5 shadow-sm text-xs leading-relaxed space-y-3">
              <div className="border-b border-tochi-border pb-3 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-tochi-text text-sm font-sans">Tochi .dev Studio</h4>
                  <p className="font-mono text-[10px] text-tochi-text-muted mt-0.5">
                    PUBLIC CREDENTIAL ID: TDS-{trackInfo.code}-0001 // {fellow.student_id}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Tamper-Proof Verified</span>
                </div>
              </div>

              <p className="text-tochi-text">
                Dear <strong>{fellow.full_name}</strong>,
              </p>

              <p className="text-tochi-text-muted">
                Congratulations on successfully completing your 4-week internship program in <strong>{trackInfo.label}</strong> at <strong>Tochi .dev Studio</strong>.
              </p>

              <div className="bg-[#FAF6F0] rounded-lg p-3 border border-tochi-border text-[11px] space-y-1">
                <div><strong>Domain:</strong> {trackInfo.label}</div>
                <div><strong>Duration:</strong> {fellow.cohort_start_date} &rarr; {fellow.cohort_end_date}</div>
                <div><strong>Signatory:</strong> Antony Sojan, Founder &bull; Tochi .dev Studio</div>
                <div><strong>Verification Hash:</strong> <span className="font-mono text-[#541228]">{fellow.qr_verify_hash}</span></div>
              </div>

              <p className="text-tochi-text-muted text-[11px]">
                Your official, cryptographically signed Certificate of Internship Completion is attached to this dispatch in high-resolution PDF format.
              </p>
            </div>
          </div>

          {/* Section 2: Upload Custom Certificate PDF */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-tochi-text-muted">
                2. Upload Custom Certificate PDF
              </span>
              <span className="text-[10px] text-tochi-text-subtle font-mono">
                Security-Compliant Attachment
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-tochi-border hover:border-[#541228] bg-white hover:bg-[#FAF6F0]/40 rounded-xl p-6 text-center cursor-pointer transition-all group"
            >
              <div className="h-11 w-11 rounded-full bg-[#541228]/10 group-hover:bg-[#541228] text-[#541228] group-hover:text-white flex items-center justify-center mx-auto mb-3 transition-colors">
                <Upload className="h-5 w-5" />
              </div>

              <p className="text-xs font-semibold text-tochi-text">
                {selectedFile ? selectedFile.name : 'Click to Browse or Drag & Drop Certificate PDF'}
              </p>
              <p className="text-[11px] text-tochi-text-muted mt-1">
                Upload your self-generated, sealed certificate PDF for this candidate
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono bg-[#FAF6F0] border border-tochi-border text-tochi-text">
                <FileText className="h-3 w-3 text-[#541228]" />
                <span>Format: PDF (.pdf) &bull; Vector or Scanned</span>
              </div>
            </div>

            {/* Selected File Details */}
            {selectedFile && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold">{selectedFile.name}</span>
                    <span className="text-emerald-700 text-[11px] ml-2 font-mono">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadSuccess(null);
                  }}
                  className="p-1 text-emerald-700 hover:text-red-700 transition-colors"
                  title="Remove selected file"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Existing Certificate On File Banner */}
            {!selectedFile && hasExistingCertificate && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-700 shrink-0" />
                  <div>
                    <span className="font-medium">Active Certificate on File</span>
                    <span className="text-[11px] text-blue-700 block font-mono">
                      {fellow.certificate_url?.startsWith('data:') 
                        ? `Custom Signed PDF (${fellow.student_id})` 
                        : (fellow.certificate_url || `/api/pdf/certificate/${fellow.id}`)}
                    </span>
                  </div>
                </div>

                <a
                  href={`/api/pdf/certificate/${fellow.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white text-blue-900 border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  <span>Preview</span>
                </a>
              </div>
            )}

            {/* Status Messages */}
            {uploadSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-tochi-border bg-white flex items-center justify-between gap-3">
          <p className="text-[11px] text-tochi-text-muted font-mono hidden sm:block">
            Attached to: {fellow.email}
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isDispatching}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-tochi-text hover:bg-[#FAF6F0] border border-tochi-border transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUploadAndDispatch}
              disabled={isDispatching}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all shadow-burgundy active:scale-95 disabled:opacity-50"
            >
              <Send className={`h-3.5 w-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
              <span>
                {isUploading ? 'Uploading PDF...' : isDispatching ? 'Dispatching...' : selectedFile ? 'Upload & Dispatch Certificate' : 'Dispatch Certificate Email'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

