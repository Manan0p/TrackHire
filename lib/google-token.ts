// lib/google-token.ts
// Utility to get a valid Google access token for a user,
// refreshing it automatically if expired.

import { prisma } from "@/lib/prisma";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function getValidAccessToken(userId: string): Promise<string> {
  // 1. Get the Google Account record for this user
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account) {
    throw new Error("No Google account linked. Please sign in with Google.");
  }

  if (!account.access_token) {
    throw new Error("No access token found. Please re-authenticate with Google.");
  }

  // 2. Check if the token is still valid (expires_at is unix seconds)
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const bufferSeconds = 60; // refresh 60s before expiry
  if (account.expires_at && account.expires_at > nowInSeconds + bufferSeconds) {
    return account.access_token;
  }

  // 3. Token is expired — refresh it
  if (!account.refresh_token) {
    throw new Error(
      "Session expired and no refresh token available. Please sign in again."
    );
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to refresh Google token: ${err}`);
  }

  const tokens = await response.json() as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  const newExpiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

  // 4. Persist the new access token
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: tokens.access_token,
      expires_at: newExpiresAt,
    },
  });

  return tokens.access_token;
}

// Helper: check if account has a specific scope granted
export async function hasGoogleScope(userId: string, scope: string): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { scope: true },
  });
  if (!account?.scope) return false;
  return account.scope.includes(scope);
}
