import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Session terminated. Cryptographic credentials cleared.',
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function GET(req: NextRequest) {
  const loginUrl = new URL('/login', req.url);
  const response = NextResponse.redirect(loginUrl);
  
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
