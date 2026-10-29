'use client';

import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { TrackType, FellowStatus, TRACK_DETAILS } from '@/types/fellow';
import { generateStudentId } from '@/lib/id-generator';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  existingIds: string[];
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingIds,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [track, setTrack] = useState<TrackType>('AI_WEB_DEV');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [status, setStatus] = useState<FellowStatus>('APPLIED');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const previewStudentId = generateStudentId(track, existingIds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/fellows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          track,
          college,
          degree,
          year_of_study: yearOfStudy,
          portfolio_url: portfolioUrl,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add student');
      }

      await onSuccess();
      onClose();
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setCollege('');
      setDegree('');
      setYearOfStudy('');
      setPortfolioUrl('');
    } catch (err: any) {
      setError(err.message || 'Error creating student record');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-tochi-border bg-white p-6 shadow-modal max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-tochi-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#FAF6F0] border border-tochi-border flex items-center justify-center text-[#541228]">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-tochi-text font-sans">Add Student</h2>
              <p className="text-xs text-tochi-text-muted">
                Assigns smart sequence ID and registers student into active internship cohort
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

        {/* Dynamic ID Badge Preview */}
        <div className="mt-4 p-3 rounded-lg bg-[#FAF6F0] border border-tochi-border flex items-center justify-between">
          <span className="text-xs font-semibold text-tochi-text-muted">Assigned Student ID:</span>
          <span className="font-mono text-xs font-bold text-[#541228] bg-white px-2.5 py-1 rounded border border-tochi-border">
            {previewStudentId}
          </span>
        </div>

        {error && (
          <div className="mt-3.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-tochi-text-muted mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Neha Verma"
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-tochi-text outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-tochi-text-muted mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="neha.verma@example.com"
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-tochi-text outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-tochi-text-muted mb-1">WhatsApp / Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-tochi-text outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-tochi-text-muted mb-1">Specialization Domain *</label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value as TrackType)}
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-tochi-text outline-none"
              >
                {Object.entries(TRACK_DETAILS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label} ({meta.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-tochi-text-muted mb-1">College / University</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. IIT Madras"
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-tochi-text outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-tochi-text-muted mb-1">Year of Study</label>
              <input
                type="text"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                placeholder="e.g. 3rd Year"
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-tochi-text outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-tochi-text-muted mb-1">Portfolio / GitHub URL</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-tochi-text outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-tochi-text-muted mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FellowStatus)}
                className="w-full bg-[#FAF6F0]/60 border border-tochi-border focus:border-[#541228] focus:bg-white rounded-lg px-3 py-2 text-tochi-text outline-none"
              >
                <option value="APPLIED">Applied</option>
                <option value="OFFER_SENT">Offer Sent</option>
                <option value="IN_SPRINT">In Internship</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-tochi-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-tochi-text-muted hover:text-tochi-text hover:bg-[#FAF6F0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all shadow-burgundy active:scale-95 disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Creating Student...' : 'Create Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
