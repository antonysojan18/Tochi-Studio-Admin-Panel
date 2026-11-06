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
    
    // 1. Handle "Publish to the web" links (e.g., .../pubhtml or .../pub)
    if (fetchUrl.includes('/pubhtml')) {
      fetchUrl = fetchUrl.replace('/pubhtml', '/pub?output=csv');
    } else if (fetchUrl.includes('/pub?') && !fetchUrl.includes('output=csv')) {
      fetchUrl = `${fetchUrl}&output=csv`;
    } else if (fetchUrl.includes('docs.google.com/spreadsheets') && !fetchUrl.includes('/export?format=csv') && !fetchUrl.includes('/pub?output=csv')) {
      // 2. Handle standard Google Sheet edit/view links
      const idMatch = fetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        const sheetId = idMatch[1];
        const gidMatch = fetchUrl.match(/[#?&]gid=([0-9]+)/);
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

    // Check if Google returned an HTML login page (private spreadsheet)
    const trimmedLower = rawCsvText.trim().toLowerCase();
    if (trimmedLower.startsWith('<!doctype html') || trimmedLower.startsWith('<html')) {
      throw new Error("Google Sheet is private. In Google Sheets, click 'Share' > General access > select 'Anyone with the link can view'.");
    }
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

  // Smart helper to find column header case-insensitively using exact and substring matching
  const findValue = (row: Record<string, string>, possibleKeys: string[]): string => {
    const keys = Object.keys(row);
    // 1. Exact cleaned match
    for (const k of keys) {
      const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const pk of possibleKeys) {
        const cleanPk = pk.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey === cleanPk && row[k]) {
          return row[k].trim();
        }
      }
    }
    // 2. Substring cleaned match (handles long Google Form questions like "Select Your Internship Track", "College / University Name")
    for (const k of keys) {
      const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const pk of possibleKeys) {
        const cleanPk = pk.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey.includes(cleanPk) && row[k]) {
          return row[k].trim();
        }
      }
    }
    return '';
  };

  // Normalize candidate rows with comprehensive Google Form headers mapping
  const normalizedCandidates = rows.map(row => {
    const full_name = findValue(row, ['fullname', 'name', 'applicantname', 'studentname', 'candidatename', 'yourname', 'whatisyourname']);
    const email = findValue(row, ['emailaddress', 'email', 'mail', 'candidateemail', 'applicantemail', 'emailid']);
    const phone = findValue(row, ['phonenumber', 'whatsappnumber', 'phone', 'whatsapp', 'mobile', 'mobilenumber', 'contact', 'contactnumber', 'phoneno']);
    const college = findValue(row, ['college', 'university', 'institution', 'institute', 'school', 'collegename', 'campus']);
    const track = findValue(row, ['internshiptrack', 'track', 'domainofinterest', 'preferreddomain', 'domain', 'specialization', 'stream', 'course', 'program']);
    const portfolio_url = findValue(row, ['github', 'portfolio', 'portfoliourl', 'behance', 'linkedin', 'githuburl', 'website', 'link', 'projectlink', 'resume', 'cv']);
    const degree = findValue(row, ['degree', 'branch', 'qualification', 'major', 'department', 'course']);
    const year_of_study = findValue(row, ['yearofstudy', 'currentyear', 'graduationyear', 'year', 'batch', 'status']);

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
    updatedCount: result.updated?.length || 0,
    skippedCount: result.skippedEmails.length,
    inserted: result.inserted,
    updated: result.updated || [],
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
