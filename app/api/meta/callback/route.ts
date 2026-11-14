// Meta OAuth callback: exchanges the code for tokens and stores the
// connected Page / Instagram account as Channel rows (tokens encrypted).
// GET /api/meta/callback?code=...&state=...

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/meta-crypto";

const VERSION = process.env.META_API_VERSION || "v21.0";
const GRAPH = "https://graph.facebook.com";

type AccountsResponse = {
  data?: Array<{
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: { id: string; username?: string };
  }>;
};

async function graphGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Meta API error (HTTP ${res.status}): ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export async function GET(req: NextRequest) {
  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/app/setup/channels?error=${encodeURIComponent(message)}`, req.url)
    );
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const params = req.nextUrl.searchParams;
    const code = params.get("code");
    const state = params.get("state");
    const jar = await cookies();
    const storedRaw = jar.get("meta_oauth_state")?.value;
    jar.delete("meta_oauth_state");
    if (!code || !state || !storedRaw) return fail("Missing code or login session. Try connecting again.");
    let stored: { state: string; platform: string; uid: string };
    try {
      stored = JSON.parse(storedRaw);
    } catch {
      return fail("Bad login session. Try connecting again.");
    }
    if (stored.state !== state || stored.uid !== session.user.id) {
      return fail("Login session did not match. Try connecting again.");
    }
    const platform = stored.platform as "instagram" | "facebook";

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const siteUrl = process.env.AUTH_URL || "https://meldrune.vercel.app";
    if (!appId || !appSecret) return fail("Meta app is not configured yet. See CHANNELS_SETUP.md.");
    const redirectUri = `${siteUrl}/api/meta/callback`;

    // 1. Short-lived user token.
    const shortLived = await graphGet<{ access_token?: string; error?: { message?: string } }>(
      `${GRAPH}/${VERSION}/oauth/access_token?client_id=${encodeURIComponent(appId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&code=${encodeURIComponent(code)}`
    );
    if (!shortLived.access_token) {
      return fail(shortLived.error?.message ?? "Meta did not return a token.");
    }

    // 2. Long-lived user token (about 60 days). Page tokens issued from it
    // do not expire, so the channel stays connected.
    const longLived = await graphGet<{ access_token?: string }>(
      `${GRAPH}/${VERSION}/oauth/access_token?grant_type=fb_exchange_token` +
        `&client_id=${encodeURIComponent(appId)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&fb_exchange_token=${encodeURIComponent(shortLived.access_token)}`
    );
    const userToken = longLived.access_token ?? shortLived.access_token;

    // 3. Pages the owner manages, with any linked Instagram business account.
    const accounts = await graphGet<AccountsResponse>(
      `${GRAPH}/${VERSION}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(userToken)}`
    );
    const pages = accounts.data ?? [];
    if (pages.length === 0) {
      return fail("No Facebook Page was found on that account. Connect a Page first, then try again.");
    }

    const w = await db.workspace.findUnique({ where: { ownerId: session.user.id } });
    if (!w) return fail("Workspace not found.");

    let connected = 0;
    for (const page of pages) {
      await db.channel.upsert({
        where: {
          workspaceId_platform_externalAccountId: {
            workspaceId: w.id,
            platform: "facebook",
            externalAccountId: page.id,
          },
        },
        update: {
          displayName: page.name,
          accessTokenEnc: encryptToken(page.access_token),
          status: "connected",
          tokenExpiresAt: null,
        },
        create: {
          workspaceId: w.id,
          platform: "facebook",
          externalAccountId: page.id,
          displayName: page.name,
          accessTokenEnc: encryptToken(page.access_token),
          status: "connected",
        },
      });
      connected += 1;

      // Same Page token answers the linked Instagram account's DMs too.
      const ig = page.instagram_business_account;
      if (ig) {
        await db.channel.upsert({
          where: {
            workspaceId_platform_externalAccountId: {
              workspaceId: w.id,
              platform: "instagram",
              externalAccountId: ig.id,
            },
          },
          update: {
            displayName: ig.username ?? page.name,
            accessTokenEnc: encryptToken(page.access_token),
            status: "connected",
            tokenExpiresAt: null,
          },
          create: {
            workspaceId: w.id,
            platform: "instagram",
            externalAccountId: ig.id,
            displayName: ig.username ?? page.name,
            accessTokenEnc: encryptToken(page.access_token),
            status: "connected",
          },
        });
        connected += 1;
      }
    }
    if (connected === 0) return fail("Nothing was connected. Try again.");
    return NextResponse.redirect(
      new URL(`/app/setup/channels?connected=${platform}`, req.url)
    );
  } catch (err) {
    console.error("Meta callback failed", err);
    return fail(err instanceof Error ? err.message : "Connection failed. Try again.");
  }
}
