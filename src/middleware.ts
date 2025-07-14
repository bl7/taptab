import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run for protected paths
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    // Get the session token from cookies
    const token =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;
                                              
    if (!token) {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Default: allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};