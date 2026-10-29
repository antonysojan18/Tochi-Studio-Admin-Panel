'use client';

import React, { useState } from 'react';
import { 
  X, 
  Github, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Award, 
  Link as LinkIcon,
  Video,
  FileCheck2
} from 'lucide-react';
import { Fellow } from '@/types/fellow';

interface SubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellow: Fellow | null;
  onUpdateFellow: (id: string, updates: Partial<Fellow>) => Promise<void>;
}

export const SubmissionsModal: React.FC<SubmissionsModalProps> = ({
  isOpen,
  onClose,
  fellow,
  onUpdateFellow,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !fellow) return null;

  const currentUrls = fellow.submission_repo_urls || [];

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;
    setIsUpdating(true);
    try {
      const updatedList = [...currentUrls, newUrl.trim()];
      await onUpdateFellow(fellow.id, {
        submission_repo_urls: updatedList,
        submission_date: fellow.submission_date || new Date().toISOString(),
        status: fellow.status === 'APPLIED' || fellow.status === 'OFFER_SENT' || fellow.status === 'IN_SPRINT' 
          ? 'SUBMITTED' 
          : fellow.status,
      });
      setNewUrl('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveUrl = async (index: number) => {
    setIsUpdating(true);
    try {
      const updatedList = currentUrls.filter((_, i) => i !== index);
      await onUpdateFellow(fellow.id, {
        submission_repo_urls: updatedList,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveSubmission = async () => {
    setIsUpdating(true);
    try {
      await onUpdateFellow(fellow.id, {
        status: 'CERTIFIED',
        certificate_url: `/api/pdf/certificate/${fellow.id}`,
      });
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-tochi-border bg-white p-6 shadow-modal">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-tochi-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#FAF6F0] border border-tochi-border flex items-center justify-center text-[#541228]">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-tochi-text font-sans">
                Project Deliverables & Submissions
              </h2>
              <p className="text-xs text-tochi-text-muted">
                {fellow.full_name} &bull; <span className="font-mono">{fellow.student_id}</span>
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

        {/* Existing Submissions List */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-tochi-text mb-2">
            Submitted Artifacts & Repositories ({currentUrls.length}):
          </label>

          {currentUrls.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#FAF6F0] border border-tochi-border text-center text-xs text-tochi-text-muted">
              No project repositories submitted yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {currentUrls.map((url, idx) => {
                const isGithub = url.includes('github.com');
                const isVideo = url.includes('loom.com') || url.includes('youtube.com') || url.includes('drive.google.com');

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF6F0]/60 border border-tochi-border hover:border-tochi-border/90 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      {isGithub ? (
                        <Github className="h-4 w-4 shrink-0 text-tochi-text-muted" />
                      ) : isVideo ? (
                        <Video className="h-4 w-4 shrink-0 text-blue-700" />
                      ) : (
                        <LinkIcon className="h-4 w-4 shrink-0 text-[#541228]" />
                      )}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-tochi-text hover:underline truncate font-mono text-[11px]"
                      >
                        {url}
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-tochi-text-subtle hover:text-tochi-text hover:bg-white"
                        title="Open Link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleRemoveUrl(idx)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50"
                        title="Remove URL"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Submission Form */}
        <div className="mt-4 pt-4 border-t border-tochi-border">
          <label className="block text-xs font-semibold text-tochi-text-muted mb-1.5">
            Add Deliverable URL (GitHub / Drive / Figma / Loom):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://github.com/fellow/project"
              className="flex-1 bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-xs text-tochi-text outline-none font-mono"
            />
            <button
              onClick={handleAddUrl}
              disabled={!newUrl.trim() || isUpdating}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#FAF6F0] hover:bg-[#F3EDE2] text-tochi-text border border-tochi-border transition-all disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-tochi-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-tochi-text-muted hover:text-tochi-text hover:bg-[#FAF6F0]"
          >
            Close
          </button>

          <button
            onClick={handleApproveSubmission}
            disabled={isUpdating || currentUrls.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all shadow-burgundy active:scale-95 disabled:opacity-50"
          >
            <Award className="h-4 w-4" />
            <span>Approve as Certified</span>
          </button>
        </div>
      </div>
    </div>
  );
};
