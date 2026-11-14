// Inbound Meta webhook processing (Facebook Messenger + Instagram DMs).
// Meta POSTs one payload per batch: { object, entry: [{ messaging: [...] }] }.
// Each event is mapped to a Conversation + Message in the workspace that
// owns the connected Channel. Webhook deliveries are retried by Meta, so
// every message is deduplicated on its Meta message id ("mid").

import { db } from "@/lib/db";
import { decryptToken } from "@/lib/meta-crypto";
import { fetchSenderName } from "@/lib/meta-graph";

type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: { mid?: string; text?: string; is_echo?: boolean; attachments?: unknown[] };
};

export async function handleMetaWebhook(body: unknown): Promise<void> {
  const payload = body as { entry?: Array<{ messaging?: MessagingEvent[] }> };
  for (const entry of payload.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      try {
        await handleMessagingEvent(event);
      } catch (err) {
        // One bad event must not kill the whole batch.
        console.error("Meta webhook event failed", err);
      }
    }
  }
}

async function handleMessagingEvent(event: MessagingEvent): Promise<void> {
  const msg = event.message;
  // Ignore echoes of our own sends, and anything that is not a text message
  // (attachments, reactions, quick replies land here later if needed).
  if (!msg || msg.is_echo) return;
  const mid = msg.mid;
  const text = msg.text;
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  if (!mid || !text || !senderId || !recipientId) return;

  // Deduplicate: Meta redelivers events.
  const existing = await db.message.findUnique({ where: { externalMessageId: mid } });
  if (existing) return;

  // The recipient id is the Page ID (Facebook) or IG business account ID.
  const channel = await db.channel.findFirst({
    where: { externalAccountId: recipientId, status: "connected" },
  });
  if (!channel) return;

  // One thread per customer per channel.
  let convo = await db.conversation.findFirst({
    where: { channelId: channel.id, externalSenderId: senderId },
  });
  if (!convo) {
    let customer = channel.platform === "instagram" ? "Instagram user" : "Facebook user";
    if (channel.accessTokenEnc) {
      try {
        const name = await fetchSenderName({
          senderId,
          accessToken: decryptToken(channel.accessTokenEnc),
        });
        if (name) customer = name;
      } catch {
        // Keep the generic label — never block the message on a name lookup.
      }
    }
    convo = await db.conversation.create({
      data: {
        workspaceId: channel.workspaceId,
        customer,
        subject: `DM from ${channel.displayName ?? channel.platform}`,
        channel: channel.platform === "instagram" ? "Instagram" : "Facebook",
        channelId: channel.id,
        externalThreadId: senderId,
        externalSenderId: senderId,
      },
    });
  }

  await db.message.create({
    data: {
      conversationId: convo.id,
      role: "customer",
      body: text,
      externalMessageId: mid,
    },
  });
  await db.conversation.update({
    where: { id: convo.id },
    data: { updatedAt: new Date() },
  });
}
