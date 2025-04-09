import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  const isSignupPage = request.nextUrl.pathname === '/admin/signup';

  // If trying to access admin routes without auth, redirect to login
  if (isAdminRoute && !authCookie && !isLoginPage && !isSignupPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // If trying to access login page while authenticated, redirect to admin dashboard
  if (isLoginPage && authCookie) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
}; 