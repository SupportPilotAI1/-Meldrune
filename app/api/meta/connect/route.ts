// Starts the Meta OAuth connect flow for one workspace.
// GET /api/meta/connect?platform=instagram|facebook
// The owner must be logged in. Redirects to Meta's login dialog; Meta sends
// them back to /api/meta/callback with a code. One Meta app covers both
// platforms — the same Facebook Login flow connects the Page and, when one
// is linked, the Instagram business account.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";

const VERSION = process.env.META_API_VERSION || "v21.0";
const SCOPES = [
  "pages_messaging",
  "pages_manage_metadata",
  "pages_show_list",
  "instagram_manage_messages",
].join(",");

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const platform = req.nextUrl.searchParams.get("platform");
  if (platform !== "instagram" && platform !== "facebook") {
    return NextResponse.json(
      { error: "platform must be instagram or facebook" },
      { status: 400 }
    );
  }
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "META_APP_ID is not configured yet. See CHANNELS_SETUP.md." },
      { status: 500 }
    );
  }
  const siteUrl =
    process.env.AUTH_URL || "https://meldrune.vercel.app";
  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set(
    "meta_oauth_state",
    JSON.stringify({ state, platform, uid: session.user.id }),
    { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" }
  );
  const redirectUri = `${siteUrl}/api/meta/callback`;
  const url =
    `https://www.facebook.com/${VERSION}/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&state=${state}` +
    `&response_type=code`;
  return NextResponse.redirect(url);
}
