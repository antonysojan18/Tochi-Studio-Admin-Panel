import fs from 'fs';
import path from 'path';
import { Fellow, FellowStatus, TrackType } from '@/types/fellow';
import { INITIAL_FELLOWS } from './mock-data';
import { generateStudentId } from './id-generator';
import { getSupabaseAdminClient, isSupabaseConfigured } from './supabase/client';
import { 
  SYSTEM_CONFIG_STUDENT_ID, 
  SYSTEM_CONFIG_UUID, 
  SYSTEM_CONFIG_HASH 
} from './settings-service';
import crypto from 'crypto';

// Persistence path for file-based fallback store (handles Vercel serverless /tmp)
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'fellows.json');

// In-memory cache
let memoryFellows: Fellow[] | null = null;

function loadLocalStore(): Fellow[] {
  if (memoryFellows) return memoryFellows;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryFellows = parsed;
        return memoryFellows;
      }
    }
    const fallbackPath = path.join(process.cwd(), '.data', 'fellows.json');
    if (fs.existsSync(fallbackPath)) {
      const raw = fs.readFileSync(fallbackPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryFellows = parsed;
        return memoryFellows;
      }
    }
  } catch (err) {
    console.warn('[FellowsService] Error reading local data file:', err);
  }

  // First time initialization: completely empty array (no mock candidates)
  memoryFellows = [];
  saveLocalStore(memoryFellows);
  return memoryFellows;
}

function saveLocalStore(fellows: Fellow[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(fellows, null, 2), 'utf-8');
    memoryFellows = fellows;
  } catch (err) {
    console.warn('[FellowsService] Error saving local store:', err);
  }
}

/**
 * Fetch all fellows from Supabase or fallback store.
 */
export async function getAllFellows(): Promise<Fellow[]> {
  const isCandidate = (f: Fellow) => 
    f.student_id !== SYSTEM_CONFIG_STUDENT_ID && 
    f.id !== SYSTEM_CONFIG_UUID &&
    f.email !== 'settings@tochi.internal';

  const supabase = getSupabaseAdminClient();
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('fellows')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return (data as Fellow[]).filter(isCandidate);
      }
      if (error) {
        console.error('[FellowsService] Supabase select error:', error);
        return loadLocalStore().filter(isCandidate);
      }
    } catch (err) {
      console.error('[FellowsService] Supabase exception:', err);
      return loadLocalStore().filter(isCandidate);
    }
  }

  return loadLocalStore().filter(isCandidate);
}

/**
 * Fetch fellow by UUID or student_id.
 */
export async function getFellowById(idOrStudentId: string): Promise<Fellow | null> {
  if (
    idOrStudentId === SYSTEM_CONFIG_STUDENT_ID || 
    idOrStudentId === SYSTEM_CONFIG_UUID
  ) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (supabase && isSupabaseConfigured) {
    try {
      const isUuid = idOrStudentId.includes('-') && idOrStudentId.length > 20;
      const query = supabase.from('fellows').select('*');
      const { data, error } = isUuid
        ? await query.eq('id', idOrStudentId).maybeSingle()
        : await query.eq('student_id', idOrStudentId).maybeSingle();

      if (!error && data && data.student_id !== SYSTEM_CONFIG_STUDENT_ID) return data as Fellow;
    } catch (err) {
      console.error('[FellowsService] Supabase get error:', err);
    }
  }

  const all = loadLocalStore();
  const match = all.find(f => 
    (f.id === idOrStudentId || f.student_id === idOrStudentId) && 
    f.student_id !== SYSTEM_CONFIG_STUDENT_ID
  );
  return match || null;
}

/**
 * Public lookup by verification hash (or fallback student_id).
 */
export async function getFellowByVerifyHash(hashOrId: string): Promise<Fellow | null> {
  const clean = hashOrId.trim();
  if (
    clean === SYSTEM_CONFIG_HASH || 
    clean === SYSTEM_CONFIG_STUDENT_ID || 
    clean === SYSTEM_CONFIG_UUID
  ) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('fellows')
        .select('*')
        .or(`qr_verify_hash.eq.${clean},student_id.eq.${clean},student_id.ilike.${clean}`)
        .maybeSingle();

      if (!error && data && data.student_id !== SYSTEM_CONFIG_STUDENT_ID) return data as Fellow;
    } catch (err) {
      console.error('[FellowsService] Supabase verify lookup error:', err);
    }
  }

  const all = loadLocalStore();
  const lower = clean.toLowerCase();
  return all.find(f => 
    f.student_id !== SYSTEM_CONFIG_STUDENT_ID && (
      (f.qr_verify_hash && f.qr_verify_hash.toLowerCase() === lower) || 
      (f.student_id && f.student_id.toLowerCase() === lower) ||
      (f.id && f.id.toLowerCase() === lower)
    )
  ) || null;
}

/**
 * Create a new fellow.
 */
export async function createFellow(input: {
  full_name: string;
  email: string;
  phone: string;
  track: TrackType;
  college?: string | null;
  degree?: string | null;
  year_of_study?: string | null;
  portfolio_url?: string | null;
  status?: FellowStatus;
  cohort_start_date?: string;
  cohort_end_date?: string;
}): Promise<Fellow> {
  const all = await getAllFellows();
  const existingIds = all.map(f => f.student_id);
  const studentId = generateStudentId(input.track, existingIds);

  const now = new Date();
  const startDate = input.cohort_start_date || now.toISOString().split('T')[0];
  const endDateObj = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
  const endDate = input.cohort_end_date || endDateObj.toISOString().split('T')[0];

  const newFellow: Fellow = {
    id: crypto.randomUUID(),
    student_id: studentId,
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    college: input.college?.trim() || null,
    degree: input.degree?.trim() || null,
    year_of_study: input.year_of_study?.trim() || null,
    track: input.track,
    portfolio_url: input.portfolio_url?.trim() || null,
    status: input.status || 'APPLIED',
    cohort_start_date: startDate,
    cohort_end_date: endDate,
    submission_repo_urls: [],
    submission_date: null,
    offer_letter_url: null,
    certificate_url: null,
    qr_verify_hash: crypto.randomBytes(16).toString('hex'),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('fellows')
        .insert(newFellow)
        .select()
        .single();

      if (!error && data) {
        return data as Fellow;
      }
      console.warn('[FellowsService] Supabase insert failed, saving locally:', error);
    } catch (err) {
      console.error('[FellowsService] Supabase insert exception:', err);
    }
  }

  const local = loadLocalStore();
  local.unshift(newFellow);
  saveLocalStore(local);
  return newFellow;
}

/**
 * Update fellow fields.
 */
export async function updateFellow(id: string, updates: Partial<Fellow>): Promise<Fellow | null> {
  if (id === SYSTEM_CONFIG_STUDENT_ID || id === SYSTEM_CONFIG_UUID) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('fellows')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Fellow;
      }
    } catch (err) {
      console.error('[FellowsService] Supabase update exception:', err);
    }
  }

  const local = loadLocalStore();
  const idx = local.findIndex(f => f.id === id || f.student_id === id);
  if (idx === -1) return null;

  local[idx] = {
    ...local[idx],
    ...payload,
  };
  saveLocalStore(local);
  return local[idx];
}

/**
 * Permanently deletes a fellow from Supabase and local store.
 */
export async function deleteFellow(id: string): Promise<boolean> {
  if (id === SYSTEM_CONFIG_STUDENT_ID || id === SYSTEM_CONFIG_UUID) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  let deletedFromSupabase = false;

  if (supabase && isSupabaseConfigured) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const { error } = await supabase.from('fellows').delete().eq('id', id);
        if (!error) deletedFromSupabase = true;
      } else {
        const { error } = await supabase.from('fellows').delete().eq('student_id', id);
        if (!error) deletedFromSupabase = true;
      }
    } catch (err) {
      console.error('[FellowsService] Supabase delete exception:', err);
    }
  }

  // Also remove from local store
  const local = loadLocalStore();
  const filtered = local.filter(f => f.id !== id && f.student_id !== id);
  saveLocalStore(filtered);

  return true;
}

/**
 * Smartly maps any raw track label, Google Form option, or shorthand to the official TrackType enum.
 */
export function parseTrackType(raw?: string): TrackType {
  if (!raw) return 'AI_WEB_DEV';
  const clean = raw.trim().toUpperCase();

  // 1. Direct Track Number prefix match (from official Google Forms options)
  if (clean.includes('TRACK 01') || clean.includes('TRACK 1:') || clean.includes('TRACK 1 ') || clean.includes('TRACK1')) return 'AI_WEB_DEV';
  if (clean.includes('TRACK 02') || clean.includes('TRACK 2:') || clean.includes('TRACK 2 ') || clean.includes('TRACK2')) return 'GEN_UIUX';
  if (clean.includes('TRACK 03') || clean.includes('TRACK 3:') || clean.includes('TRACK 3 ') || clean.includes('TRACK3')) return 'AUTOMATION';
  if (clean.includes('TRACK 04') || clean.includes('TRACK 4:') || clean.includes('TRACK 4 ') || clean.includes('TRACK4')) return 'FULL_STACK';
  if (clean.includes('TRACK 05') || clean.includes('TRACK 5:') || clean.includes('TRACK 5 ') || clean.includes('TRACK5')) return 'ML_AI';
  if (clean.includes('TRACK 06') || clean.includes('TRACK 6:') || clean.includes('TRACK 6 ') || clean.includes('TRACK6')) return 'AI_TOOLS';

  // 2. Full official track title matches
  if (clean.includes('AI WEB DEVELOPMENT') || clean.includes('WEB DEVELOPMENT') || clean.includes('WEB DEV')) return 'AI_WEB_DEV';
  if (clean.includes('GENERATIVE UI') || clean.includes('UI UX') || clean.includes('UI/UX') || clean.includes('UIUX') || clean.includes('PRODUCT DESIGN')) return 'GEN_UIUX';
  if (clean.includes('INTELLIGENT AUTOMATION') || clean.includes('AUTOMATION') || clean.includes('RPA')) return 'AUTOMATION';
  if (clean.includes('FULL STACK') || clean.includes('FULLSTACK') || clean.includes('FSTK')) return 'FULL_STACK';
  if (clean.includes('MACHINE LEARNING') || clean.includes('ML WITH AI') || /\bML\b/.test(clean)) return 'ML_AI';
  if (clean.includes('MASTER IN AI TOOLS') || clean.includes('AI TOOLS')) return 'AI_TOOLS';

  // 3. Distinctive keyword fallbacks
  if (clean.includes('FIGMA') || clean.includes('DESIGN TOKENS') || clean.includes('FRAMER') || clean.includes('DESIGN') || clean.includes('UX')) return 'GEN_UIUX';
  if (clean.includes('N8N') || clean.includes('ZAPIER') || clean.includes('MAKE.COM') || clean.includes('AGENTIC WORKFLOWS') || clean.includes('INTELLIGENT')) return 'AUTOMATION';
  if (clean.includes('BACKEND') || clean.includes('NODE') || clean.includes('POSTGRESQL') || clean.includes('STACK')) return 'FULL_STACK';
  if (clean.includes('PYTORCH') || clean.includes('TENSORFLOW') || clean.includes('DEEP LEARNING') || clean.includes('NEURAL') || clean.includes('LEARNING')) return 'ML_AI';
  if (clean.includes('PROMPT') || clean.includes('CHATGPT') || clean.includes('CLAUDE') || clean.includes('TOOL') || clean.includes('MASTER')) return 'AI_TOOLS';
  if (clean.includes('WEB') || clean.includes('FRONTEND') || clean.includes('HTML') || clean.includes('CSS') || clean.includes('REACT') || clean.includes('CURSOR')) return 'AI_WEB_DEV';

  return 'AI_WEB_DEV';
}

/**
 * Batch insert or update from Google Sheet / CSV.
 */
export async function batchInsertFromSheet(records: Array<{
  full_name: string;
  email: string;
  phone: string;
  college?: string;
  track?: string;
  portfolio_url?: string;
  degree?: string;
  year_of_study?: string;
}>): Promise<{
  inserted: Fellow[];
  updated: Fellow[];
  skippedEmails: string[];
  totalProcessed: number;
}> {
  const currentFellows = await getAllFellows();
  const fellowMapByEmail = new Map<string, Fellow>();
  currentFellows.forEach(f => fellowMapByEmail.set(f.email.toLowerCase().trim(), f));
  const existingIds = currentFellows.map(f => f.student_id);

  const inserted: Fellow[] = [];
  const updated: Fellow[] = [];
  const skippedEmails: string[] = [];

  for (const rec of records) {
    const email = (rec.email || '').trim().toLowerCase();
    if (!email || !email.includes('@') || email === 'settings@tochi.internal') {
      continue;
    }

    const correctTrack = parseTrackType(rec.track);
    const existing = fellowMapByEmail.get(email);

    if (existing) {
      // Check if existing fellow needs track, student_id, or profile correction
      let needsUpdate = false;
      let newStudentId = existing.student_id;

      if (existing.track !== correctTrack) {
        // Track was misidentified or updated! Re-calculate student ID with correct track prefix
        newStudentId = generateStudentId(correctTrack, existingIds);
        existingIds.push(newStudentId);
        needsUpdate = true;
      }

      const updates: Partial<Fellow> = {};
      if (existing.track !== correctTrack) {
        updates.track = correctTrack;
        updates.student_id = newStudentId;
      }
      if (rec.college?.trim() && rec.college.trim() !== existing.college) {
        updates.college = rec.college.trim();
        needsUpdate = true;
      }
      if (rec.degree?.trim() && rec.degree.trim() !== existing.degree) {
        updates.degree = rec.degree.trim();
        needsUpdate = true;
      }
      if (rec.year_of_study?.trim() && rec.year_of_study.trim() !== existing.year_of_study) {
        updates.year_of_study = rec.year_of_study.trim();
        needsUpdate = true;
      }
      if (rec.portfolio_url?.trim() && rec.portfolio_url.trim() !== existing.portfolio_url) {
        updates.portfolio_url = rec.portfolio_url.trim();
        needsUpdate = true;
      }
      if (rec.phone?.trim() && rec.phone.trim() !== '+910000000000' && rec.phone.trim() !== existing.phone) {
        updates.phone = rec.phone.trim();
        needsUpdate = true;
      }
      if (rec.full_name?.trim() && rec.full_name.trim() !== existing.full_name) {
        updates.full_name = rec.full_name.trim();
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updatedFellow = await updateFellow(existing.id, updates);
        if (updatedFellow) {
          updated.push(updatedFellow);
          fellowMapByEmail.set(email, updatedFellow);
        }
      } else {
        skippedEmails.push(email);
      }
      continue;
    }

    // New candidate insertion
    const newId = generateStudentId(correctTrack, existingIds);
    existingIds.push(newId);

    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newFellow: Fellow = {
      id: crypto.randomUUID(),
      student_id: newId,
      full_name: rec.full_name?.trim() || 'Candidate',
      email: email,
      phone: rec.phone?.trim() || '+910000000000',
      college: rec.college?.trim() || null,
      degree: rec.degree?.trim() || null,
      year_of_study: rec.year_of_study?.trim() || null,
      track: correctTrack,
      portfolio_url: rec.portfolio_url?.trim() || null,
      status: 'APPLIED',
      cohort_start_date: startDate,
      cohort_end_date: endDate,
      submission_repo_urls: [],
      submission_date: null,
      offer_letter_url: null,
      certificate_url: null,
      qr_verify_hash: crypto.randomBytes(16).toString('hex'),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    inserted.push(newFellow);
    fellowMapByEmail.set(email, newFellow);
  }

  if (inserted.length > 0) {
    const supabase = getSupabaseAdminClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('fellows').insert(inserted);
      } catch (err) {
        console.error('[FellowsService] Supabase batch insert error:', err);
      }
    }

    const local = loadLocalStore();
    for (const item of inserted) {
      local.unshift(item);
    }
    saveLocalStore(local);
  }

  return {
    inserted,
    updated,
    skippedEmails,
    totalProcessed: records.length,
  };
}

