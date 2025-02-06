import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      
      // Protect admin routes
      if (isAdminRoute && !isLoggedIn) {
        return Response.redirect(new URL('/login?redirect=' + nextUrl.pathname, nextUrl));
      }

      // Allow all other routes
      return true;

    },
  },
} satisfies NextAuthConfig;
