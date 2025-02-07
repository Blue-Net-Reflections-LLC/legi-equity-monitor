import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;
// Configure which routes to run the middleware on
export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/api/:path*',
    '/login',
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)'
  ]
} 