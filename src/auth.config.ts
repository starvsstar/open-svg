import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { getUserByEmail } from "@/data/user";

export type UserRole = "USER" | "ADMIN";

const trustHost = process.env.AUTH_TRUST_HOST === "true";
const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
const providers: NextAuthConfig["providers"] = [
  Credentials({
    async authorize(credentials: any) {
      try {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email);

        if (!user || !user.password_hash) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password_hash);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          avatar_url: user.avatar_url,
        };
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    Github({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

export default {
  providers,
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user.role || "USER") as UserRole;
        token.id = user.id;
        token.avatar_url = user.avatar_url;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role || "USER") as UserRole;
        session.user.avatar_url = token.avatar_url as string | null;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  trustHost,
  ...(cookieDomain
    ? {
        cookies: {
          sessionToken: {
            name: "__Secure-next-auth.session-token",
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: true,
              domain: cookieDomain,
            },
          },
        },
      }
    : {}),
} satisfies NextAuthConfig;
