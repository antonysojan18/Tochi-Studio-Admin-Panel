'use client';

import React from 'react';
import { TrackType, FellowStatus, TRACK_DETAILS, STATUS_DETAILS, Fellow } from '@/types/fellow';
import { Layers, Filter } from 'lucide-react';

interface FilterBarProps {
  fellows: Fellow[];
  selectedTrack: TrackType | 'ALL';
  onSelectTrack: (track: TrackType | 'ALL') => void;
  selectedStatus: FellowStatus | 'ALL';
  onSelectStatus: (status: FellowStatus | 'ALL') => void;
}

const ALL_TRACKS: TrackType[] = [
  'AI_WEB_DEV',
  'GEN_UIUX',
  'AUTOMATION',
  'FULL_STACK',
  'ML_AI',
  'AI_TOOLS',
];

const ALL_STATUSES: FellowStatus[] = [
  'APPLIED',
  'OFFER_SENT',
  'IN_SPRINT',
  'SUBMITTED',
  'CERTIFIED',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  fellows,
  selectedTrack,
  onSelectTrack,
  selectedStatus,
  onSelectStatus,
}) => {
  return (
    <div className="flex flex-col gap-2.5 py-3 border-b border-tochi-border">
      {/* Track Filters Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center gap-1.5 text-tochi-text-muted font-medium pr-2 border-r border-tochi-border shrink-0">
          <Layers className="h-3.5 w-3.5 text-[#541228]" />
          <span>Track:</span>
        </div>

        <button
          onClick={() => onSelectTrack('ALL')}
          className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 ${
            selectedTrack === 'ALL'
              ? 'bg-[#541228] text-white font-semibold shadow-sm'
              : 'bg-white text-tochi-text-muted hover:text-tochi-text hover:bg-[#FAF6F0] border border-tochi-border shadow-card'
          }`}
        >
          All Tracks ({fellows.length})
        </button>

        {ALL_TRACKS.map((track) => {
          const count = fellows.filter(f => f.track === track).length;
          const meta = TRACK_DETAILS[track];
          const isActive = selectedTrack === track;

          return (
            <button
              key={track}
              onClick={() => onSelectTrack(track)}
              className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#541228] text-white font-semibold shadow-sm'
                  : 'bg-white text-tochi-text-muted hover:text-tochi-text hover:bg-[#FAF6F0] border border-tochi-border shadow-card'
              }`}
            >
              <span>{meta.shortLabel}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-[#FAF6F0] text-tochi-text-subtle'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Filters Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center gap-1.5 text-tochi-text-muted font-medium pr-2 border-r border-tochi-border shrink-0">
          <Filter className="h-3.5 w-3.5 text-[#541228]" />
          <span>State:</span>
        </div>

        <button
          onClick={() => onSelectStatus('ALL')}
          className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 ${
            selectedStatus === 'ALL'
              ? 'bg-[#541228] text-white font-semibold shadow-sm'
              : 'bg-white text-tochi-text-muted hover:text-tochi-text hover:bg-[#FAF6F0] border border-tochi-border shadow-card'
          }`}
        >
          All States ({fellows.length})
        </button>

        {ALL_STATUSES.map((status) => {
          const count = fellows.filter(f => f.status === status).length;
          const meta = STATUS_DETAILS[status];
          const isActive = selectedStatus === status;

          return (
            <button
              key={status}
              onClick={() => onSelectStatus(status)}
              className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#541228] text-white font-semibold shadow-sm'
                  : `${meta.bg} ${meta.text} border ${meta.border} hover:opacity-90`
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white' : meta.dot}`} />
              <span>{meta.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-current'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
