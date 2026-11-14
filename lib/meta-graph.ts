// Outbound sends to Meta's Graph API (Facebook Messenger + Instagram DMs).
// One Meta app covers both: Facebook replies go to /{page-id}/messages with
// the Page token, Instagram replies (Facebook Login route) go to
// /{ig-user-id}/messages with the same Page token.

const VERSION = process.env.META_API_VERSION || "v21.0";
const GRAPH = "https://graph.facebook.com";

export type MetaPlatform = "instagram" | "facebook";

export async function sendMetaMessage(opts: {
  platform: MetaPlatform;
  senderId: string; // Page ID (Facebook) or IG business account ID (Instagram)
  accessToken: string;
  recipientId: string; // the customer's sender id from the webhook
  text: string;
}): Promise<string | undefined> {
  const url = `${GRAPH}/${VERSION}/${opts.senderId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: opts.recipientId },
      messaging_type: "RESPONSE",
      message: { text: opts.text },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Meta send failed (${opts.platform}, HTTP ${res.status}): ${detail.slice(0, 300)}`
    );
  }
  const data = (await res.json()) as { message_id?: string };
  return data.message_id;
}

// Meta only lets a business reply within 24 hours of the customer's last
// message. Outside that window the reply is refused by the API.
export const META_REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

export function withinReplyWindow(lastInboundAt: Date | null | undefined): boolean {
  if (!lastInboundAt) return false;
  return Date.now() - lastInboundAt.getTime() < META_REPLY_WINDOW_MS;
}

// Best-effort lookup of a DM sender's display name. Never throws — the
// caller falls back to a generic label when this fails.
export async function fetchSenderName(opts: {
  senderId: string;
  accessToken: string;
}): Promise<string | null> {
  try {
    const res = await fetch(
      `${GRAPH}/${VERSION}/${opts.senderId}?fields=name&access_token=${encodeURIComponent(opts.accessToken)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { name?: string };
    return data.name ?? null;
  } catch {
    return null;
  }
}
