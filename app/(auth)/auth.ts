import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import db from "@/lib/db";
import { authConfig } from './auth.config';

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  emailVerified: Date | null;
  role: string;
}

const upsertUser = async (user: User) => {
  try {
    const result = await db`
      INSERT INTO users (
        id, email, first_name, last_name, image_url, email_verified, role
      ) VALUES (
        ${user.id}, ${user.email}, ${user.firstName}, ${user.lastName}, 
        ${user.image}, ${user.emailVerified}, ${user.role || 'user'}
      )
      ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        image_url = EXCLUDED.image_url,
        email_verified = EXCLUDED.email_verified,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    return result[0]?.id;
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
}

const getUserIdByEmail = async (email: string) => {
  try {
    const result = await db`
      SELECT id, role FROM users WHERE email = ${email}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

// Extend the built-in session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user']
  }
  interface User {
    role?: string;
  }
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const userData = await getUserIdByEmail(session.user.email);
        session.user.id = userData?.id || token.sub || '';
        session.user.role = userData?.role || 'user';
      }
      return session;
    },
    async signIn({ user, profile }) {
      if (!profile?.email) return false;
      if (!user.id) return false;
      if (!profile.email) return false;
      
      const nameParts = profile.name?.split(' ') || [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      await upsertUser({
        id: user.id,
        email: profile.email as string,
        firstName,
        lastName,
        image: typeof profile.picture === 'string' ? profile.picture : null,

        emailVerified: new Date(),
        role: 'user'
      });
      return true;
    }
  }
});
