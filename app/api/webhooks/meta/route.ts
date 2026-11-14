// Meta webhook endpoint: https://meldrune.vercel.app/api/webhooks/meta
// GET  — Meta's one-time verification handshake (hub.mode / hub.verify_token
//        / hub.challenge) when the webhook is registered in the Meta app.
// POST — inbound Messenger / Instagram message events. The signature is
//        verified, the caller gets a 200 immediately, and the payload is
//        processed afterwards with after() so Meta never times out.

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { verifyMetaSignature } from "@/lib/meta-crypto";
import { handleMetaWebhook } from "@/lib/meta-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  const verifyToken = process.env.META_VERIFY_TOKEN;
  if (
    mode === "subscribe" &&
    challenge &&
    verifyToken &&
    token === verifyToken
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  after(async () => {
    try {
      await handleMetaWebhook(body);
    } catch (err) {
      console.error("Meta webhook processing failed", err);
    }
  });
  return NextResponse.json({ received: true }, { status: 200 });
}
