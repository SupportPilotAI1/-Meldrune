import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { disconnectChannel } from "./actions";

const PLATFORMS = [
  {
    key: "instagram",
    name: "Instagram",
    blurb: "Customer DMs to your business Instagram land in the inbox.",
  },
  {
    key: "facebook",
    name: "Facebook",
    blurb: "Messages to your Facebook Page land in the inbox.",
  },
] as const;

export default async function Channels({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const s = await auth();
  const w = await db.workspace.findUnique({
    where: { ownerId: s!.user.id },
    include: { channels: { orderBy: { createdAt: "asc" } } },
  });
  const byPlatform = new Map((w?.channels ?? []).map((c) => [c.platform, c]));

  return (
    <>
      <p>
        <Link href="/app/setup">← Back to setup</Link>
      </p>
      <h1>Channels</h1>
      <p className="muted">
        Connect your social inboxes so customer DMs arrive here and your
        replies go back out to the customer. You can only reply to people who
        message you first, and only within 24 hours of their last message —
        that is Meta&apos;s rule, not ours.
      </p>
      {params.connected && (
        <div className="panel">
          <b>Connected.</b> Your {params.connected === "instagram" ? "Instagram" : "Facebook"}{" "}
          account is linked. New DMs will appear in the inbox.
        </div>
      )}
      {params.error && (
        <div className="panel">
          <b>Couldn&apos;t connect:</b> {params.error}
        </div>
      )}
      {PLATFORMS.map((p) => {
        const ch = byPlatform.get(p.key);
        return (
          <div className="panel" key={p.key}>
            <h2>{p.name}</h2>
            <p className="muted">{p.blurb}</p>
            {ch ? (
              <>
                <p>
                  <span className="pill">Connected</span> {ch.displayName ?? ch.externalAccountId}
                </p>
                <p className="muted">
                  Connected {ch.createdAt.toLocaleDateString()} · status: {ch.status}
                </p>
                <form action={disconnectChannel}>
                  <input type="hidden" name="platform" value={p.key} />
                  <button className="btn">Disconnect {p.name}</button>
                </form>
              </>
            ) : (
              <Link className="btn" href={`/api/meta/connect?platform=${p.key}`}>
                Connect {p.name}
              </Link>
            )}
          </div>
        );
      })}
      <div className="panel">
        <h2>Before this works for real businesses</h2>
        <p className="muted">
          Connecting works in test mode right away for accounts that have a role on the
          Meta app. For any other business to connect, Meta has to approve the app first
          (App Review + Business Verification) — the steps are in CHANNELS_SETUP.md.
          Until then, only the app&apos;s own test accounts can connect.
        </p>
      </div>
    </>
  );
}
