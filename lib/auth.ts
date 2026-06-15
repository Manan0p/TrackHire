import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Full Google OAuth scope: OpenID + Gmail readonly + Calendar events
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "development" ? "trackhire-dev-secret" : undefined),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          // Request offline access so we get a refresh_token
          access_type: "offline",
          // Force consent screen every time so refresh_token is always issued
          prompt: "consent",
          response_type: "code",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.RESEND_FROM_EMAIL || "noreply@trackhire.app",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "google" && user?.id) {
        const existingAccount = await prisma.account.findFirst({
          where: { userId: user.id, provider: "google" },
        });
        if (existingAccount) {
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: {
              access_token: account.access_token,
              refresh_token: account.refresh_token ?? existingAccount.refresh_token,
              expires_at: account.expires_at,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
        }
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  trustHost: true,
});
