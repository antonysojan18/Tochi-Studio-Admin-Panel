import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key) {
      const value = await getSetting(key);
      return NextResponse.json({ success: true, key, value });
    }

    const googleSheetUrl = await getSetting('google_sheet_url');
    return NextResponse.json({
      success: true,
      settings: {
        google_sheet_url: googleSheetUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body.key || (body.google_sheet_url !== undefined ? 'google_sheet_url' : null);
    const value = body.value !== undefined ? body.value : body.google_sheet_url;

    if (!key || typeof value !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid setting key and string value required' },
        { status: 400 }
      );
    }

    await setSetting(key, value.trim());

    return NextResponse.json({
      success: true,
      key,
      value: value.trim(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update setting' },
      { status: 500 }
    );
  }
}

