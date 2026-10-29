import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      username: session.username,
      role: session.role,
    },
  });
}

