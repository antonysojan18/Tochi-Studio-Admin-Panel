import fs from 'fs';
import path from 'path';
import { getSupabaseAdminClient, isSupabaseConfigured } from './supabase/client';

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), '.data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// In-memory cache for fast response
let memorySettings: Record<string, string> = {};

function loadLocalSettings(): Record<string, string> {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
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
 */
export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const supabase = getSupabaseAdminClient();
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data && typeof data.value === 'string') {
        memorySettings[key] = data.value;
        return data.value;
      }
    } catch (err) {
      // Supabase table may not exist yet or project paused; gracefully use fallback
    }
  }

  const local = loadLocalSettings();
  return local[key] !== undefined ? local[key] : defaultValue;
}

/**
 * Saves a persistent setting value to Supabase and fallback store.
 */
export async function setSetting(key: string, value: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase
        .from('app_settings')
        .upsert(
          {
            key,
            value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
    } catch (err) {
      // Fallback
    }
  }

  const local = loadLocalSettings();
  local[key] = value;
  saveLocalSettings(local);
  return true;
}
