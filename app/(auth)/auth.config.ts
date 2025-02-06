import type { NextAuthConfig } from 'next-auth';

const adminRoles = ['admin', 'author', 'editor'];

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
      if (isAdminRoute) {
        const userRole = auth?.user?.role || 'user';
        if (!isLoggedIn || !adminRoles.includes(userRole)) {
          return Response.redirect(new URL('/login', nextUrl));
        }
        return true;
      }

      // Allow all other routes
      return true;
    },
  },
} satisfies NextAuthConfig;
