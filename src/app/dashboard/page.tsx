'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Fellow, FellowStatus, TrackType } from '@/types/fellow';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { CandidateTable } from '@/components/dashboard/CandidateTable';
import { SyncSheetModal } from '@/components/dashboard/SyncSheetModal';
import { AddCandidateModal } from '@/components/dashboard/AddCandidateModal';
import { PdfPreviewModal } from '@/components/dashboard/PdfPreviewModal';
import { CertificateDispatchModal } from '@/components/dashboard/CertificateDispatchModal';
import { MessagePreviewModal } from '@/components/dashboard/MessagePreviewModal';
import { SubmissionsModal } from '@/components/dashboard/SubmissionsModal';
import { SessionGuard } from '@/components/dashboard/SessionGuard';
import { EmailTemplateType } from '@/lib/email/templates';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Info
} from 'lucide-react';

export default function DashboardPage() {
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<FellowStatus | 'ALL'>('ALL');

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Offer Letter PDF Preview Modal
  const [pdfModalFellow, setPdfModalFellow] = useState<Fellow | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Certificate Dispatch & Upload Modal
  const [certificateFellow, setCertificateFellow] = useState<Fellow | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  // Message Preview Modal (Welcome & Submission links)
  const [previewFellow, setPreviewFellow] = useState<Fellow | null>(null);
  const [previewType, setPreviewType] = useState<EmailTemplateType>('WELCOME');
  const [isMessagePreviewOpen, setIsMessagePreviewOpen] = useState(false);

  // Submissions Modal
  const [submissionsModalFellow, setSubmissionsModalFellow] = useState<Fellow | null>(null);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);

  // Email sending state
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchFellows = async () => {
    try {
      const res = await fetch('/api/fellows');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFellows(data.data);
      }
    } catch (err) {
      console.error('Failed to load fellows', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFellows();
  }, []);

  // Update Status
  const handleUpdateStatus = async (id: string, newStatus: FellowStatus) => {
    setFellows(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));

    try {
      const res = await fetch(`/api/fellows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      showToast(`Status updated to ${newStatus}`);
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
      fetchFellows();
    }
  };

  // Update Dates
  const handleUpdateDates = async (id: string, startDate: string, endDate: string) => {
    setFellows(prev => prev.map(f => f.id === id ? { ...f, cohort_start_date: startDate, cohort_end_date: endDate } : f));

    try {
      const res = await fetch(`/api/fellows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohort_start_date: startDate, cohort_end_date: endDate }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update sprint dates');
      }
      showToast('Sprint window updated successfully');
    } catch (err: any) {
      showToast(err.message || 'Date update failed', 'error');
      fetchFellows();
    }
  };

  // Direct Update Fellow fields
  const handleDirectUpdateFellow = async (id: string, updates: Partial<Fellow>) => {
    setFellows(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));

    try {
      const res = await fetch(`/api/fellows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update');
      }
      showToast('Candidate record updated');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
      fetchFellows();
    }
  };

  // Open Offer Letter PDF Modal
  const handleOpenOfferPdfModal = (fellow: Fellow) => {
    setPdfModalFellow(fellow);
    setIsPdfModalOpen(true);
  };

  // Open Certificate Upload & Dispatch Modal
  const handleOpenCertificateModal = (fellow: Fellow) => {
    setCertificateFellow(fellow);
    setIsCertificateModalOpen(true);
  };

  // Open Message Preview Modal
  const handleOpenMessagePreview = (fellow: Fellow, type: EmailTemplateType) => {
    setPreviewFellow(fellow);
    setPreviewType(type);
    setIsMessagePreviewOpen(true);
  };

  // Open Submissions Modal
  const handleOpenSubmissionsModal = (fellow: Fellow) => {
    setSubmissionsModalFellow(fellow);
    setIsSubmissionsModalOpen(true);
  };

  // Dispatch Email Action
  const handleSendEmailAction = async (
    fellow: Fellow, 
    type: EmailTemplateType
  ) => {
    setIsSendingEmail(fellow.id);
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

      const msg = data.mocked 
        ? `Simulated email (${type}) processed for ${fellow.email}`
        : `Email (${type}) successfully dispatched to ${fellow.email}`;
      showToast(msg, 'success');

      if (type === 'OFFER' || type === 'CERTIFICATE') {
        fetchFellows();
      }
    } catch (err: any) {
      showToast(err.message || 'Error dispatching email', 'error');
    } finally {
      setIsSendingEmail(null);
    }
  };

  // Filtered fellows computation
  const filteredFellows = useMemo(() => {
    return fellows.filter(f => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = f.full_name.toLowerCase().includes(q);
        const matchesEmail = f.email.toLowerCase().includes(q);
        const matchesId = f.student_id.toLowerCase().includes(q);
        const matchesCollege = f.college?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesId && !matchesCollege) {
          return false;
        }
      }

      if (selectedTrack !== 'ALL' && f.track !== selectedTrack) {
        return false;
      }

      if (selectedStatus !== 'ALL' && f.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [fellows, searchQuery, selectedTrack, selectedStatus]);

  const existingIds = useMemo(() => fellows.map(f => f.student_id), [fellows]);

  return (
    <div className="min-h-screen bg-tochi-canvas text-tochi-text selection:bg-[#541228]/15 selection:text-[#541228]">
      {/* Auto-logout idle guard */}
      <SessionGuard />

      {/* Top Header Bar with Grid Stats & Ingestion Strip */}
      <HeaderBar
        fellows={fellows}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isSupabaseLive={true}
        onSyncSuccess={fetchFellows}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Filter Navigation Bar */}
        <FilterBar
          fellows={fellows}
          selectedTrack={selectedTrack}
          onSelectTrack={setSelectedTrack}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
        />

        {/* Toolbar info row */}
        <div className="flex items-center justify-between text-xs text-tochi-text-muted mt-3.5 mb-2">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-tochi-text">{filteredFellows.length}</strong> of {fellows.length} students</span>
            {(selectedTrack !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTrack('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="text-[#541228] font-semibold hover:underline ml-2"
              >
                Reset filters
              </button>
            )}
          </div>

          <button
            onClick={fetchFellows}
            className="flex items-center gap-1.5 hover:text-tochi-text transition-colors text-[11px]"
            title="Refresh database"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>

        {/* Candidate Data Grid Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center border border-tochi-border my-6 shadow-card">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#541228] mb-2" />
            <p className="text-xs text-tochi-text-muted">Loading candidate database records...</p>
          </div>
        ) : (
          <CandidateTable
            fellows={filteredFellows}
            onUpdateStatus={handleUpdateStatus}
            onUpdateDates={handleUpdateDates}
            onOpenPdfModal={handleOpenOfferPdfModal}
            onOpenCertificateModal={handleOpenCertificateModal}
            onOpenMessagePreview={handleOpenMessagePreview}
            onOpenSubmissionsModal={handleOpenSubmissionsModal}
            isSendingEmail={isSendingEmail}
          />
        )}
      </main>

      {/* Sync Sheet Modal (Fallback) */}
      <SyncSheetModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSuccess={fetchFellows}
      />

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchFellows}
        existingIds={existingIds}
      />

      {/* Offer Letter PDF Live Preview Modal */}
      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        fellow={pdfModalFellow}
        type="OFFER"
        onEmailSent={fetchFellows}
      />

      {/* Dedicated Certificate Dispatch & Upload Modal */}
      <CertificateDispatchModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        fellow={certificateFellow}
        onSuccess={fetchFellows}
      />

      {/* Message & Email Preview Modal */}
      <MessagePreviewModal
        isOpen={isMessagePreviewOpen}
        onClose={() => setIsMessagePreviewOpen(false)}
        fellow={previewFellow}
        type={previewType}
        onConfirmSend={handleSendEmailAction}
      />

      {/* Submissions Modal */}
      <SubmissionsModal
        isOpen={isSubmissionsModalOpen}
        onClose={() => setIsSubmissionsModalOpen(false)}
        fellow={submissionsModalFellow}
        onUpdateFellow={handleDirectUpdateFellow}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-tochi-border shadow-modal text-xs animate-in slide-in-from-bottom-2 duration-150">
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          ) : (
            <Info className="h-4 w-4 text-[#541228] shrink-0" />
          )}
          <span className="text-tochi-text font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
