import { NextRequest, NextResponse } from 'next/server';
import { getFellowByVerifyHash } from '@/lib/fellows-service';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hashOrId = searchParams.get('hash') || searchParams.get('id') || searchParams.get('q');

    if (!hashOrId) {
      return NextResponse.json(
        { success: false, error: 'hash or id query parameter required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const fellow = await getFellowByVerifyHash(hashOrId);
    if (!fellow) {
      return NextResponse.json(
        { success: false, error: 'No matching verified fellowship record found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: fellow.id,
        student_id: fellow.student_id,
        full_name: fellow.full_name,
        track: fellow.track,
        status: fellow.status,
        cohort_start_date: fellow.cohort_start_date,
        cohort_end_date: fellow.cohort_end_date,
        qr_verify_hash: fellow.qr_verify_hash,
        college: fellow.college,
        has_certificate: fellow.status === 'CERTIFIED',
        has_offer: Boolean(fellow.status !== 'APPLIED'),
      },
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Verification lookup failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}

