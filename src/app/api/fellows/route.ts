import { NextRequest, NextResponse } from 'next/server';
import { getAllFellows, createFellow } from '@/lib/fellows-service';
import { FellowStatus, TrackType } from '@/types/fellow';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const track = searchParams.get('track') as TrackType | null;
    const status = searchParams.get('status') as FellowStatus | null;

    let fellows = await getAllFellows();

    if (q) {
      fellows = fellows.filter(f => 
        f.full_name.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        f.student_id.toLowerCase().includes(q) ||
        (f.college && f.college.toLowerCase().includes(q))
      );
    }

    if (track) {
      fellows = fellows.filter(f => f.track === track);
    }

    if (status) {
      fellows = fellows.filter(f => f.status === status);
    }

    return NextResponse.json({
      success: true,
      count: fellows.length,
      data: fellows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch fellows' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, phone, track, college, degree, year_of_study, portfolio_url, status, cohort_start_date, cohort_end_date } = body;

    if (!full_name || !email || !phone || !track) {
      return NextResponse.json(
        { success: false, error: 'full_name, email, phone, and track are required fields' },
        { status: 400 }
      );
    }

    const fellow = await createFellow({
      full_name,
      email,
      phone,
      track,
      college,
      degree,
      year_of_study,
      portfolio_url,
      status: status || 'APPLIED',
      cohort_start_date,
      cohort_end_date,
    });

    return NextResponse.json({
      success: true,
      data: fellow,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create fellow' },
      { status: 500 }
    );
  }
}

