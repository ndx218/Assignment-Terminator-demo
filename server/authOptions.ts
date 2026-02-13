// server/authOptions.ts
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import type { NextAuthOptions, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/types/next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || '',
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER || '',
          pass: process.env.EMAIL_SERVER_PASSWORD || '',
        },
      },
      from: process.env.EMAIL_FROM || '',
    }),
  ],

  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 365 * 24 * 60 * 60,
    updateAge: 30 * 24 * 60 * 60,
  },

  // 在開發環境使用 HTTP，生產環境使用 HTTPS
  useSecureCookies: process.env.NODE_ENV === 'production',

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role as UserRole;
        token.credits = (user as any).credits ?? 0;
        token.phone = (user as any).phone ?? null;
        token.referredBy = (user as any).referredBy ?? null;
        token.referralCode = (user as any).referralCode ?? null;
      }
      if (trigger === 'update' && session) {
        if ('credits' in session) (token as any).credits = (session as any).credits;
        if ('role' in session) (token as any).role = (session as any).role;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.credits = token.credits ?? 0;
        session.user.phone = token.phone ?? null;
        session.user.referredBy = token.referredBy ?? null;
        session.user.referralCode = token.referralCode ?? null;
      }
      return session;
    },

    async signIn({ user }) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email ?? undefined },
        });
        if (dbUser) {
          (user as any).phone = dbUser.phone ?? null;
          (user as any).referredBy = dbUser.referredBy ?? null;
          (user as any).referralCode = dbUser.referralCode ?? null;
        }
      } catch (e) {
        console.error('[auth:signIn] DB lookup failed:', e);
        // 不阻擋登入，adapter 會建立新用戶
      }
      return true;
    },

    redirect({ url, baseUrl }) {
      if (url.toLowerCase().includes('/login')) {
        return baseUrl;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
};
