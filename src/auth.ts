import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { UserRole } from "./auth.config";

const trustHost = process.env.AUTH_TRUST_HOST === "true";
const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
const providers: NextAuthConfig["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: {
        label: "Email",
        type: "email",
        placeholder: "hello@example.com",
      },
      password: {
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
      },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;

      if (typeof email !== "string" || typeof password !== "string") {
        throw new Error("Invalid credentials");
      }

      const user = await db.users.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
          name: true,
          password_hash: true,
          avatar_url: true,
          role: true,
        },
      });

      if (!user || !user.password_hash) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role as UserRole,
      };
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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatar_url = token.avatar_url as string | null;
        session.user.role = (token.role || "USER") as UserRole;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatar_url = user.avatar_url;
        const dbUser = await db.users.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = (dbUser?.role || "USER") as UserRole;
      }
      return token;
    },
  },
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
});
