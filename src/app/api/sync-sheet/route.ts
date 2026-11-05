import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { batchInsertFromSheet } from '@/lib/fellows-service';
import { getSetting, setSetting } from '@/lib/settings-service';

/**
 * Core engine to fetch, parse, and insert new candidates from Google Sheet CSV
 */
async function processSync(sheetUrlToUse?: string, rawCsvInput?: string) {
  let rawCsvText = '';

  let sheetUrl = sheetUrlToUse;
  if (!sheetUrl && !rawCsvInput) {
    sheetUrl = await getSetting('google_sheet_url');
  }

  if (sheetUrl && sheetUrl.trim()) {
    let fetchUrl = sheetUrl.trim();
    
    // Auto-convert standard Google Sheet sharing URL to CSV export format
    if (fetchUrl.includes('docs.google.com/spreadsheets') && !fetchUrl.includes('/export?format=csv')) {
      const idMatch = fetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        const sheetId = idMatch[1];
        const gidMatch = fetchUrl.match(/gid=([0-9]+)/);
        const gidPart = gidMatch ? `&gid=${gidMatch[1]}` : '';
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidPart}`;
      }
    }

    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TOCHI-Labs-OS/1.0)',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Google Sheet (${res.status} ${res.statusText}). Verify sharing settings.`);
    }

    rawCsvText = await res.text();
  } else if (rawCsvInput) {
    rawCsvText = rawCsvInput;
  } else {
    return {
      success: true,
      message: 'No Google Sheet URL configured. Awaiting link.',
      insertedCount: 0,
      skippedCount: 0,
      totalRows: 0,
    };
  }

  if (!rawCsvText.trim()) {
    return {
      success: true,
      message: 'Google Sheet CSV is currently empty.',
      insertedCount: 0,
      skippedCount: 0,
      totalRows: 0,
    };
  }

  // Parse CSV with PapaParse
  const parsed = Papa.parse<Record<string, string>>(rawCsvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const rows = parsed.data || [];
  if (rows.length === 0) {
    return {
      success: true,
      message: 'No candidate rows detected.',
      insertedCount: 0,
      skippedCount: 0,
      totalRows: 0,
    };
  }

  // Helper to find column header case-insensitively
  const findValue = (row: Record<string, string>, possibleKeys: string[]): string => {
    const keys = Object.keys(row);
    for (const pk of possibleKeys) {
      const matchingKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === pk.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (matchingKey && row[matchingKey]) {
        return row[matchingKey].trim();
      }
    }
    return '';
  };

  // Normalize candidate rows
  const normalizedCandidates = rows.map(row => {
    const full_name = findValue(row, ['fullname', 'name', 'studentname', 'candidatename', 'applicantname']);
    const email = findValue(row, ['email', 'emailaddress', 'mail', 'candidateemail']);
    const phone = findValue(row, ['phone', 'phonenumber', 'whatsapp', 'whatsappnumber', 'mobile', 'contact', 'contactnumber']);
    const college = findValue(row, ['college', 'university', 'institution', 'school']);
    const track = findValue(row, ['track', 'domain', 'specialization', 'role', 'stream', 'program']);
    const portfolio_url = findValue(row, ['portfolio', 'portfoliourl', 'github', 'githuburl', 'linkedin', 'website']);
    const degree = findValue(row, ['degree', 'branch', 'course', 'major']);
    const year_of_study = findValue(row, ['year', 'yearofstudy', 'graduationyear', 'batch']);

    return {
      full_name,
      email,
      phone,
      college,
      track,
      portfolio_url,
      degree,
      year_of_study,
    };
  }).filter(c => c.email && c.email.includes('@'));

  const result = await batchInsertFromSheet(normalizedCandidates);

  return {
    success: true,
    totalRows: rows.length,
    validCandidates: normalizedCandidates.length,
    insertedCount: result.inserted.length,
    skippedCount: result.skippedEmails.length,
    inserted: result.inserted,
  };
}

/**
 * GET: Automated background sync (called every 30 seconds by the backend)
 */
export async function GET() {
  try {
    const result = await processSync();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Auto-sync error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Saves URL universally across all devices & immediately triggers ingestion
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { sheetUrl, csvContent } = body;

    // If sheetUrl was provided, save it universally for all logged-in devices
    if (typeof sheetUrl === 'string') {
      await setSetting('google_sheet_url', sheetUrl.trim());
    }

    const result = await processSync(sheetUrl, csvContent);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing sheet sync' },
      { status: 500 }
    );
  }
}
