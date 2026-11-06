import fs from 'fs';
import path from 'path';
import { getSupabaseAdminClient, isSupabaseConfigured } from './supabase/client';

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), '.data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Dedicated internal config record in fellows table (guarantees universal persistence across devices even before app_settings table is created)
export const SYSTEM_CONFIG_STUDENT_ID = '__SYSTEM_CONFIG__';
export const SYSTEM_CONFIG_UUID = '00000000-0000-0000-0000-000000000001';
export const SYSTEM_CONFIG_HASH = 'system_settings_hash_0000000001';

// In-memory cache for fast response
let memorySettings: Record<string, string> = {};

function loadLocalSettings(): Record<string, string> {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      memorySettings = JSON.parse(raw) || {};
      return memorySettings;
    }
    const fallbackPath = path.join(process.cwd(), '.data', 'settings.json');
    if (fs.existsSync(fallbackPath)) {
      const raw = fs.readFileSync(fallbackPath, 'utf-8');
      memorySettings = JSON.parse(raw) || {};
      return memorySettings;
    }
  } catch (err) {
    console.warn('[SettingsService] Failed to read local settings file:', err);
  }
  return memorySettings;
}

function saveLocalSettings(settings: Record<string, string>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    memorySettings = settings;
  } catch (err) {
    console.warn('[SettingsService] Failed to save local settings:', err);
  }
}

/**
 * Retrieves a persistent setting value from Supabase or fallback store.
 * Checks:
 * 1. Dedicated app_settings table
 * 2. Fellows table __SYSTEM_CONFIG__ record (universal cloud database fallback)
 * 3. Local filesystem and in-memory cache
 */
export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured) {
    // 1. Try dedicated app_settings table
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data && typeof data.value === 'string' && data.value.trim()) {
        memorySettings[key] = data.value.trim();
        return data.value.trim();
      }
    } catch {
      // app_settings table might not exist yet
    }

    // 2. Query universal cloud safety net in fellows table (__SYSTEM_CONFIG__)
    try {
      const { data: configRow, error } = await supabase
        .from('fellows')
        .select('portfolio_url, submission_repo_urls')
        .eq('student_id', SYSTEM_CONFIG_STUDENT_ID)
        .maybeSingle();

      if (!error && configRow) {
        if (key === 'google_sheet_url' && configRow.portfolio_url) {
          memorySettings[key] = configRow.portfolio_url.trim();
          return configRow.portfolio_url.trim();
        }
        const map = (configRow.submission_repo_urls as Record<string, string>) || {};
        if (map[key] && typeof map[key] === 'string' && map[key].trim()) {
          memorySettings[key] = map[key].trim();
          return map[key].trim();
        }
      }
    } catch {
      // Supabase connection or table error
    }
  }

  // 3. Fallback to local file / in-memory cache
  const local = loadLocalSettings();
  return local[key] !== undefined ? local[key] : defaultValue;
}

/**
 * Saves a persistent setting value to Supabase and fallback store.
 * Updates:
 * 1. Dedicated app_settings table (if available)
 * 2. Fellows table __SYSTEM_CONFIG__ record (universal cloud database)
 * 3. Local filesystem and in-memory cache
 */
export async function setSetting(key: string, value: string): Promise<boolean> {
  const cleanVal = (value || '').trim();
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured) {
    // 1. Attempt to upsert into dedicated app_settings table
    try {
      await supabase
        .from('app_settings')
        .upsert(
          {
            key,
            value: cleanVal,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
    } catch {
      // Silent catch if table does not exist
    }

    // 2. ALSO ALWAYS upsert to fellows table (__SYSTEM_CONFIG__) as instant universal cloud storage
    try {
      const { data: existing } = await supabase
        .from('fellows')
        .select('submission_repo_urls, portfolio_url')
        .eq('student_id', SYSTEM_CONFIG_STUDENT_ID)
        .maybeSingle();

      const existingMap = (existing?.submission_repo_urls as Record<string, string>) || {};
      existingMap[key] = cleanVal;

      await supabase
        .from('fellows')
        .upsert(
          {
            id: SYSTEM_CONFIG_UUID,
            student_id: SYSTEM_CONFIG_STUDENT_ID,
            full_name: 'SYSTEM_SETTINGS',
            email: 'settings@tochi.internal',
            phone: '+0000000000',
            track: 'AI_WEB_DEV',
            status: 'APPLIED',
            portfolio_url: key === 'google_sheet_url' ? cleanVal : (existing?.portfolio_url || ''),
            submission_repo_urls: existingMap,
            cohort_start_date: '2026-01-01',
            cohort_end_date: '2099-01-01',
            qr_verify_hash: SYSTEM_CONFIG_HASH,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'student_id' }
        );
    } catch (err) {
      console.warn('[SettingsService] Failed to upsert __SYSTEM_CONFIG__ row:', err);
    }
  }

  // 3. Persist to local filesystem
  const local = loadLocalSettings();
  local[key] = cleanVal;
  saveLocalSettings(local);
  return true;
}
