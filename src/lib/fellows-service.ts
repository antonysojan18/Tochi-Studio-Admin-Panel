import fs from 'fs';
import path from 'path';
import { Fellow, FellowStatus, TrackType } from '@/types/fellow';
import { INITIAL_FELLOWS } from './mock-data';
import { generateStudentId } from './id-generator';
import { getSupabaseAdminClient, isSupabaseConfigured } from './supabase/client';
import crypto from 'crypto';

// Persistence path for file-based fallback store
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'fellows.json');

// In-memory cache
let memoryFellows: Fellow[] | null = null;

function loadLocalStore(): Fellow[] {
  if (memoryFellows) return memoryFellows;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryFellows = JSON.parse(raw);
      return memoryFellows || INITIAL_FELLOWS;
    }
  } catch (err) {
    console.warn('[FellowsService] Error reading local data file, falling back to initial data', err);
  }

  // First time initialization
  memoryFellows = [...INITIAL_FELLOWS];
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
  const supabase = getSupabaseAdminClient();
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('fellows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FellowsService] Supabase select error:', error);
        return loadLocalStore();
      }
      if (data && data.length > 0) {
        return data as Fellow[];
      }
    } catch (err) {
      console.error('[FellowsService] Supabase exception:', err);
      return loadLocalStore();
    }
  }

  return loadLocalStore();
}

/**
 * Fetch fellow by UUID or student_id.
 */
export async function getFellowById(idOrStudentId: string): Promise<Fellow | null> {
  const supabase = getSupabaseAdminClient();
  if (supabase && isSupabaseConfigured) {
    try {
      const isUuid = idOrStudentId.includes('-') && idOrStudentId.length > 20;
      const query = supabase.from('fellows').select('*');
      const { data, error } = isUuid
        ? await query.eq('id', idOrStudentId).maybeSingle()
        : await query.eq('student_id', idOrStudentId).maybeSingle();

      if (!error && data) return data as Fellow;
    } catch (err) {
      console.error('[FellowsService] Supabase get error:', err);
    }
  }

  const all = loadLocalStore();
  const match = all.find(f => f.id === idOrStudentId || f.student_id === idOrStudentId);
  return match || null;
}

/**
 * Public lookup by verification hash (or fallback student_id).
 */
export async function getFellowByVerifyHash(hashOrId: string): Promise<Fellow | null> {
  const clean = hashOrId.trim();
  const supabase = getSupabaseAdminClient();
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('fellows')
        .select('*')
        .or(`qr_verify_hash.eq.${clean},student_id.eq.${clean}`)
        .maybeSingle();

      if (!error && data) return data as Fellow;
    } catch (err) {
      console.error('[FellowsService] Supabase verify lookup error:', err);
    }
  }

  const all = loadLocalStore();
  return all.find(f => f.qr_verify_hash === clean || f.student_id === clean) || null;
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
 * Batch insert from Google Sheet / CSV.
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
  skippedEmails: string[];
  totalProcessed: number;
}> {
  const currentFellows = await getAllFellows();
  const existingEmailSet = new Set(currentFellows.map(f => f.email.toLowerCase().trim()));
  const existingIds = currentFellows.map(f => f.student_id);

  const inserted: Fellow[] = [];
  const skippedEmails: string[] = [];

  for (const rec of records) {
    const email = (rec.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      continue;
    }

    if (existingEmailSet.has(email)) {
      skippedEmails.push(email);
      continue;
    }

    // Map track string to TrackType
    let track: TrackType = 'AI_WEB_DEV';
    const rawTrack = (rec.track || '').toUpperCase();
    if (rawTrack.includes('UI') || rawTrack.includes('UX') || rawTrack.includes('DESIGN')) {
      track = 'GEN_UIUX';
    } else if (rawTrack.includes('AUTO') || rawTrack.includes('RPA') || rawTrack.includes('FLOW')) {
      track = 'AUTOMATION';
    } else if (rawTrack.includes('STACK') || rawTrack.includes('FULL') || rawTrack.includes('FSTK')) {
      track = 'FULL_STACK';
    } else if (rawTrack.includes('ML') || rawTrack.includes('MACHINE') || rawTrack.includes('DATA')) {
      track = 'ML_AI';
    } else if (rawTrack.includes('TOOL') || rawTrack.includes('INTERNAL')) {
      track = 'AI_TOOLS';
    } else {
      track = 'AI_WEB_DEV';
    }

    const newId = generateStudentId(track, existingIds);
    existingIds.push(newId);
    existingEmailSet.add(email);

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
      track: track,
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
    skippedEmails,
    totalProcessed: records.length,
  };
}

