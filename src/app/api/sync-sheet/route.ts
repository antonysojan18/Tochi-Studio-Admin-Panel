import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { batchInsertFromSheet } from '@/lib/fellows-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { sheetUrl, csvContent } = body;

    let rawCsvText = '';

    if (sheetUrl) {
      let fetchUrl = sheetUrl.trim();
      
      // Auto-convert standard Google Sheet URL to CSV export format
      if (fetchUrl.includes('docs.google.com/spreadsheets') && !fetchUrl.includes('/export?format=csv')) {
        const idMatch = fetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
          const sheetId = idMatch[1];
          // Check for gid
          const gidMatch = fetchUrl.match(/gid=([0-9]+)/);
          const gidPart = gidMatch ? `&gid=${gidMatch[1]}` : '';
          fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidPart}`;
        }
      }

      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TOCHI-Labs-OS/1.0)',
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to fetch Google Sheet (${res.status} ${res.statusText}). Make sure the spreadsheet is shared as 'Anyone with the link can view'.`,
          },
          { status: 400 }
        );
      }

      rawCsvText = await res.text();
    } else if (csvContent) {
      rawCsvText = csvContent;
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide either sheetUrl or csvContent' },
        { status: 400 }
      );
    }

    if (!rawCsvText.trim()) {
      return NextResponse.json(
        { success: false, error: 'CSV data is empty' },
        { status: 400 }
      );
    }

    // Parse CSV with PapaParse
    const parsed = Papa.parse<Record<string, string>>(rawCsvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse CSV format', details: parsed.errors },
        { status: 400 }
      );
    }

    const rows = parsed.data;
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data rows found in CSV' },
        { status: 400 }
      );
    }

    // Helper to find header case-insensitively
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

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      validCandidates: normalizedCandidates.length,
      insertedCount: result.inserted.length,
      skippedCount: result.skippedEmails.length,
      inserted: result.inserted,
      skippedEmails: result.skippedEmails,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing sheet sync' },
      { status: 500 }
    );
  }
}

