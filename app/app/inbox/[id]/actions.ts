"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { buildFaqDraft } from "@/lib/faq-draft";

const SAFE_DRAFT =
  "Thanks for reaching out. I want to make sure I give you accurate information. Could you share a little more detail so I can help?";

export async function generateDraft(form: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Unauthorized");
  const w = await db.workspace.findUnique({
    where: { ownerId: s.user.id },
    include: { faqs: true },
  });
  const id = String(form.get("id"));
  const c = await db.conversation.findFirst({
    where: { id, workspaceId: w!.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!c) throw new Error("Conversation not found");

  const knowledge = w!.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
  const transcript = c.messages.map((m) => `${m.role}: ${m.body}`).join("\n");

  let draft = SAFE_DRAFT;
  if (process.env.OPENAI_API_KEY) {
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You draft customer-support replies for ${w!.name}. Tone: ${w!.tone}. Use only the approved knowledge below for business-specific claims. If the answer is not in the knowledge, say you need a human teammate to confirm. Never invent refunds, policies, order status, or promises.\n\nAPPROVED KNOWLEDGE:\n${knowledge || "No approved knowledge has been added."}`,
        },
        { role: "user", content: `Write a concise reply to this conversation:\n${transcript}` },
      ],
    });
    draft = result.choices[0]?.message.content || draft;
  } else {
    // No AI key: ground the draft in the workspace FAQs when one matches
    // the customer's latest message; otherwise keep the safe sentence.
    draft = buildFaqDraft(c.messages, w!.faqs) ?? draft;
  }

  await db.message.create({ data: { conversationId: id, role: "draft", body: draft } });
  revalidatePath(`/app/inbox/${id}`);
}
