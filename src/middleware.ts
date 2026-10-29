import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'tochi_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const isAuthenticated = Boolean(token && token.includes('.') && token.length > 30);

  // Protected paths: /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // AUTO-LOGOUT WHEN ENTERING /login:
  // Whenever the link is clicked or accessed, automatically wipe active session cookies so fresh authentication is mandatory.
  if (pathname === '/login') {
    const response = NextResponse.next();
    if (token) {
      response.cookies.delete(SESSION_COOKIE);
      response.cookies.set({
        name: SESSION_COOKIE,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
