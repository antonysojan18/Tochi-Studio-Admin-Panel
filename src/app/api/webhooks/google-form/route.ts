import { NextRequest, NextResponse } from 'next/server';
import { createFellow, getAllFellows } from '@/lib/fellows-service';
import { sendFellowEmail } from '@/lib/email/resend';
import { TrackType } from '@/types/fellow';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Map common Google Form payload formats
    const fullName = payload.full_name || payload.name || payload['Full Name'] || payload['Name'];
    const email = payload.email || payload['Email'] || payload['Email Address'];
    const phone = payload.phone || payload.whatsapp || payload['Phone'] || payload['WhatsApp Number'] || '+910000000000';
    const rawTrack = payload.track || payload['Track'] || payload['Preferred Track'] || 'AI_WEB_DEV';
    const college = payload.college || payload['College'] || payload['University'];
    const portfolioUrl = payload.portfolio_url || payload['Portfolio'] || payload['GitHub URL'];

    if (!fullName || !email) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Map raw track string
    let track: TrackType = 'AI_WEB_DEV';
    const str = String(rawTrack).toUpperCase();
    if (str.includes('UI') || str.includes('UX')) track = 'GEN_UIUX';
    else if (str.includes('AUTO') || str.includes('FLOW')) track = 'AUTOMATION';
    else if (str.includes('FULL') || str.includes('STACK')) track = 'FULL_STACK';
    else if (str.includes('ML') || str.includes('AI') && !str.includes('WEB')) track = 'ML_AI';
    else if (str.includes('TOOL')) track = 'AI_TOOLS';

    // Check if email already exists
    const all = await getAllFellows();
    const existing = all.find(f => f.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Applicant already exists in pipeline',
        fellow: existing,
        isNew: false,
      });
    }

    // Create fellow
    const fellow = await createFellow({
      full_name: fullName,
      email,
      phone,
      track,
      college,
      portfolio_url: portfolioUrl,
      status: 'APPLIED',
    });

    // Automatically dispatch welcome email acknowledgment
    const origin = req.headers.get('origin') || req.headers.get('host') ? `https://${req.headers.get('host')}` : undefined;
    await sendFellowEmail({
      fellow,
      type: 'WELCOME',
      hostUrl: origin,
    });

    return NextResponse.json({
      success: true,
      message: 'New application received and welcome email triggered',
      fellow,
      isNew: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/google-form',
    description: 'Accepts POST JSON from Google Apps Script or webhooks to ingest applicants.',
    samplePayload: {
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210',
      track: 'AI_WEB_DEV',
      college: 'IIT Madras',
      portfolio_url: 'https://github.com/johndoe',
    },
  });
}

