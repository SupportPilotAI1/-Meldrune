"use server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function disconnectChannel(form: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Unauthorized");
  const w = await db.workspace.findUnique({ where: { ownerId: s.user.id } });
  if (!w) throw new Error("Workspace missing");
  const platform = String(form.get("platform"));
  if (platform !== "instagram" && platform !== "facebook") {
    throw new Error("Unknown channel.");
  }
  // Deleting the channel removes its stored (encrypted) token. Threads that
  // came in from it stay in the inbox, but can no longer be replied to
  // from Meldrune.
  await db.channel.deleteMany({ where: { workspaceId: w.id, platform } });
  revalidatePath("/app/setup/channels");
}
