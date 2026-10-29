export type FellowStatus = 
  | 'APPLIED' 
  | 'OFFER_SENT' 
  | 'IN_SPRINT' 
  | 'SUBMITTED' 
  | 'CERTIFIED';

export type TrackType = 
  | 'AI_WEB_DEV' 
  | 'GEN_UIUX' 
  | 'AUTOMATION' 
  | 'FULL_STACK' 
  | 'ML_AI' 
  | 'AI_TOOLS';

export interface Fellow {
  id: string;
  student_id: string; // e.g. TCL-26Q4-WEB-0001
  full_name: string;
  email: string;
  phone: string;
  college: string | null;
  degree: string | null;
  year_of_study: string | null;
  track: TrackType;
  portfolio_url: string | null;
  status: FellowStatus;
  cohort_start_date: string; // YYYY-MM-DD
  cohort_end_date: string;   // YYYY-MM-DD
  submission_repo_urls: string[];
  submission_date: string | null;
  offer_letter_url: string | null;
  certificate_url: string | null;
  qr_verify_hash: string;
  created_at: string;
  updated_at: string;
}

export interface TrackMetadata {
  code: string;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  description: string;
}

export const TRACK_DETAILS: Record<TrackType, TrackMetadata> = {
  AI_WEB_DEV: {
    code: 'WEB',
    label: 'AI-Augmented Web Engineering',
    shortLabel: 'AI Web Dev',
    badgeBg: 'bg-[#F7EEF1]',
    badgeText: 'text-[#541228]',
    border: 'border-[#541228]/20',
    description: 'Next.js, Agentic UI, LLM APIs & Cloud Architecture',
  },
  GEN_UIUX: {
    code: 'UIUX',
    label: 'Generative UI/UX & Systems',
    shortLabel: 'Gen UI/UX',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    border: 'border-purple-200',
    description: 'Design Tokens, Figma, Generative UI Components & Motion',
  },
  AUTOMATION: {
    code: 'AUTO',
    label: 'Autonomous Workflow Engineering',
    shortLabel: 'Automation',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    border: 'border-cyan-200',
    description: 'Multi-Agent Orchestration, Webhooks, RPA & API pipelines',
  },
  FULL_STACK: {
    code: 'FSTK',
    label: 'Full-Stack Product Architecture',
    shortLabel: 'Full-Stack',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    border: 'border-amber-200',
    description: 'TypeScript, PostgreSQL, Serverless Microservices & DevOps',
  },
  ML_AI: {
    code: 'MLAI',
    label: 'Machine Learning & Applied AI',
    shortLabel: 'ML / AI',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    border: 'border-rose-200',
    description: 'RAG Systems, Vector DBs, Fine-Tuning & Model Deployment',
  },
  AI_TOOLS: {
    code: 'TOOL',
    label: 'AI Tooling & Internal Systems',
    shortLabel: 'AI Tools',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    border: 'border-indigo-200',
    description: 'CLI tooling, Custom IDE extensions, SDKs & DevEx automation',
  },
};

export const STATUS_DETAILS: Record<FellowStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  APPLIED: {
    label: 'Applied',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    dot: 'bg-stone-400',
    border: 'border-stone-200',
  },
  OFFER_SENT: {
    label: 'Offer Sent',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  IN_SPRINT: {
    label: 'In Sprint',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  SUBMITTED: {
    label: 'Submitted',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    dot: 'bg-purple-500',
    border: 'border-purple-200',
  },
  CERTIFIED: {
    label: 'Certified',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
};
