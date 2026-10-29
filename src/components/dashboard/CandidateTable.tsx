'use client';

import React, { useState } from 'react';
import {
  Fellow,
  FellowStatus,
  TRACK_DETAILS,
  STATUS_DETAILS
} from '@/types/fellow';
import {
  Copy,
  Check,
  ExternalLink,
  Mail,
  FileText,
  Award,
  Send,
  Github,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { EmailTemplateType } from '@/lib/email/templates';

interface CandidateTableProps {
  fellows: Fellow[];
  onUpdateStatus: (id: string, newStatus: FellowStatus) => Promise<void>;
  onUpdateDates: (id: string, startDate: string, endDate: string) => Promise<void>;
  onOpenPdfModal: (fellow: Fellow, type: 'OFFER') => void;
  onOpenCertificateModal: (fellow: Fellow) => void;
  onOpenMessagePreview: (fellow: Fellow, type: EmailTemplateType) => void;
  onOpenSubmissionsModal: (fellow: Fellow) => void;
  isSendingEmail: string | null;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  fellows,
  onUpdateStatus,
  onUpdateDates,
  onOpenPdfModal,
  onOpenCertificateModal,
  onOpenMessagePreview,
  onOpenSubmissionsModal,
  isSendingEmail,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDatesId, setEditingDatesId] = useState<string | null>(null);
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEditDates = (fellow: Fellow) => {
    setEditingDatesId(fellow.id);
    setTempStart(fellow.cohort_start_date);
    setTempEnd(fellow.cohort_end_date);
  };

  const handleSaveDates = async (fellowId: string) => {
    if (tempStart && tempEnd) {
      await onUpdateDates(fellowId, tempStart, tempEnd);
    }
    setEditingDatesId(null);
  };

  if (fellows.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-tochi-border my-6 shadow-card">
        <h3 className="text-sm font-semibold text-tochi-text">No candidates found</h3>
        <p className="text-xs text-tochi-text-muted mt-1 max-w-sm mx-auto">
          Try adjusting your search criteria, selecting "All Tracks", or syncing candidates from your Google Sheet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-tochi-border bg-white my-4 shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-tochi-border bg-[#FAF6F0] text-tochi-text-muted uppercase font-mono text-[10px] tracking-wider">
              <th className="py-3.5 px-4 font-semibold border-r border-tochi-border/60">Student ID</th>
              <th className="py-3.5 px-4 font-semibold border-r border-tochi-border/60">Candidate &amp; Contact</th>
              <th className="py-3.5 px-4 font-semibold border-r border-tochi-border/60">Track</th>
              <th className="py-3.5 px-4 font-semibold border-r border-tochi-border/60">Status</th>
              <th className="py-3.5 px-4 font-semibold border-r border-tochi-border/60">Sprint Window</th>
              <th className="py-3.5 px-4 font-semibold border-r border-tochi-border/60">Submissions</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tochi-border/70 text-tochi-text">
            {fellows.map((fellow) => {
              const trackMeta = TRACK_DETAILS[fellow.track] || {
                code: 'DEV',
                label: fellow.track,
                shortLabel: fellow.track,
                badgeBg: 'bg-stone-100',
                badgeText: 'text-stone-800',
                border: 'border-stone-200',
              };

              const statusMeta = STATUS_DETAILS[fellow.status] || STATUS_DETAILS.APPLIED;
              const isBusy = isSendingEmail === fellow.id;

              return (
                <tr
                  key={fellow.id}
                  className="hover:bg-[#FAF6F0]/40 transition-colors group"
                >
                  {/* Column 1: Student ID */}
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap border-r border-tochi-border/50">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-tochi-text bg-[#FAF6F0] px-2.5 py-1 rounded border border-tochi-border text-[11px]">
                        {fellow.student_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(fellow.student_id, fellow.id)}
                        className="text-tochi-text-subtle hover:text-[#541228] p-1 rounded hover:bg-[#FAF6F0] transition-all opacity-60 group-hover:opacity-100"
                        title="Copy Student ID"
                      >
                        {copiedId === fellow.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Column 2: Candidate & Contact (WhatsApp completely removed) */}
                  <td className="py-3.5 px-4 border-r border-tochi-border/50">
                    <div>
                      <div className="font-semibold text-sm text-tochi-text flex items-center gap-2">
                        <span>{fellow.full_name}</span>
                        {fellow.portfolio_url && (
                          <a
                            href={fellow.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-tochi-text-subtle hover:text-[#541228] transition-colors"
                            title="Open Portfolio or GitHub"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-tochi-text-muted truncate max-w-[210px] mt-0.5">
                        {fellow.college || 'Engineering Candidate'}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <a
                          href={`mailto:${fellow.email}`}
                          className="text-[11px] font-mono text-tochi-text-muted hover:text-[#541228] flex items-center gap-1 transition-colors"
                        >
                          <Mail className="h-3 w-3 text-tochi-text-subtle" />
                          <span>{fellow.email}</span>
                        </a>
                        <span className="text-tochi-text-subtle font-mono text-[10px]">{fellow.phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Track Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap border-r border-tochi-border/50">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${trackMeta.badgeBg} ${trackMeta.badgeText} ${trackMeta.border}`}
                    >
                      {trackMeta.shortLabel}
                    </span>
                  </td>

                  {/* Column 4: Status Selector Dropdown */}
                  <td className="py-3.5 px-4 whitespace-nowrap border-r border-tochi-border/50">
                    <div className="relative inline-block">
                      <select
                        value={fellow.status}
                        onChange={(e) => onUpdateStatus(fellow.id, e.target.value as FellowStatus)}
                        className={`text-[11px] font-semibold rounded-full px-2.5 py-1 pr-6 border appearance-none cursor-pointer outline-none transition-all ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                      >
                        <option value="APPLIED">Applied</option>
                        <option value="OFFER_SENT">Offer Sent</option>
                        <option value="IN_SPRINT">In Sprint</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="CERTIFIED">Certified</option>
                      </select>
                      <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </td>

                  {/* Column 5: Sprint Window */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-tochi-text-muted border-r border-tochi-border/50">
                    {editingDatesId === fellow.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={tempStart}
                          onChange={(e) => setTempStart(e.target.value)}
                          className="bg-white border border-tochi-border text-tochi-text text-[10px] px-1.5 py-0.5 rounded outline-none font-mono"
                        />
                        <span className="text-tochi-text-subtle">&rarr;</span>
                        <input
                          type="date"
                          value={tempEnd}
                          onChange={(e) => setTempEnd(e.target.value)}
                          className="bg-white border border-tochi-border text-tochi-text text-[10px] px-1.5 py-0.5 rounded outline-none font-mono"
                        />
                        <button
                          onClick={() => handleSaveDates(fellow.id)}
                          className="px-2 py-0.5 bg-[#541228] hover:bg-[#6B1733] text-white rounded text-[10px] font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEditDates(fellow)}
                        className="flex items-center gap-1.5 font-mono text-[11px] hover:text-[#541228] hover:bg-[#FAF6F0] px-2 py-1 rounded transition-colors group/dates"
                        title="Click to edit sprint window"
                      >
                        <Calendar className="h-3 w-3 text-tochi-text-subtle group-hover/dates:text-[#541228]" />
                        <span>{fellow.cohort_start_date}</span>
                        <span className="text-tochi-text-subtle">&rarr;</span>
                        <span>{fellow.cohort_end_date}</span>
                      </button>
                    )}
                  </td>

                  {/* Column 6: Submission Links */}
                  <td className="py-3.5 px-4 whitespace-nowrap border-r border-tochi-border/50">
                    <button
                      onClick={() => onOpenSubmissionsModal(fellow)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono border border-tochi-border bg-[#FAF6F0] hover:bg-[#F3EDE2] transition-all text-tochi-text shadow-sm"
                    >
                      <Github className="h-3.5 w-3.5 text-tochi-text-muted" />
                      <span>{fellow.submission_repo_urls?.length || 0} links</span>
                      {fellow.submission_date && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" title="Submitted" />
                      )}
                    </button>
                  </td>

                  {/* Column 7: High-Velocity Action Hub (Enlarged Buttons with Preview) */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      {/* Button 1: Send Welcome (Bigger with clear label) */}
                      <button
                        onClick={() => onOpenMessagePreview(fellow, 'WELCOME')}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#FAF6F0] text-tochi-text border border-tochi-border transition-all active:scale-95 shadow-sm hover:border-[#541228]/40 disabled:opacity-50"
                        title="Preview & Send Welcome Email"
                      >
                        <Mail className="h-3.5 w-3.5 text-[#541228]" />
                        <span>Send Welcome</span>
                      </button>

                      {/* Button 2: Offer Letter */}
                      <button
                        onClick={() => onOpenPdfModal(fellow, 'OFFER')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF6F0] hover:bg-[#F3EDE2] text-[#541228] border border-[#541228]/25 transition-all active:scale-95 shadow-sm"
                        title="Preview & Dispatch Offer Letter PDF"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#541228]" />
                        <span>Offer Letter</span>
                      </button>

                      {/* Button 3: Submission Link (Bigger with clear label) */}
                      <button
                        onClick={() => onOpenMessagePreview(fellow, 'SUBMISSION')}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 transition-all active:scale-95 shadow-sm hover:border-blue-400 disabled:opacity-50"
                        title="Preview & Dispatch Mid-Sprint Submission Link"
                      >
                        <Send className="h-3.5 w-3.5 text-blue-700" />
                        <span>Submission Link</span>
                      </button>

                      {/* Button 4: Certificate (Dedicated Upload & Dispatch Modal) */}
                      <button
                        onClick={() => onOpenCertificateModal(fellow)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#541228] hover:bg-[#6B1733] text-white transition-all active:scale-95 shadow-burgundy"
                        title="Upload Certificate & Dispatch Congratulatory Notice"
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>Certificate</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
