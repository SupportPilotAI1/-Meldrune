import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Meldrune",
  description: "How Meldrune collects, uses, and protects your data.",
};

export default function Privacy() {
  return (
    <>
      <nav>
        <span className="brand">MELDRUNE</span>
        <Link href="/">Home</Link>
      </nav>
      <main className="shell">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: November 14, 2026.</p>

        <div className="panel">
          <h2>What Meldrune is</h2>
          <p>
            Meldrune is a customer-support inbox for small businesses. A business
            creates a workspace, adds its own answers to common questions, and
            reads and replies to customer messages in one place.
          </p>

          <h2>What we collect</h2>
          <p>When you use Meldrune, we collect:</p>
          <ul>
            <li>
              <b>Your account details</b> — your name, email address, and a
              password (stored as a one-way hash, never in plain text).
            </li>
            <li>
              <b>Your business information</b> — your business name, the
              answers you save in your knowledge base, and your reply tone.
            </li>
            <li>
              <b>Customer conversations</b> — messages customers send to your
              business, and the replies you send back, so they appear in your
              inbox.
            </li>
            <li>
              <b>Connected social accounts</b> — if you connect Instagram or
              Facebook, we store the access tokens Meta gives us so we can
              receive your messages and send your replies. Tokens are stored
              encrypted and are never shown to anyone, including us, in plain
              text.
            </li>
          </ul>

          <h2>How we use it</h2>
          <p>
            Your data is used only to run your workspace: to show your inbox,
            to draft replies from your own saved answers, and to send replies
            you approve through the channels you connected. We do not sell your
            data, and we do not use your customer conversations to train models
            or to advertise to anyone.
          </p>

          <h2>Connected platforms</h2>
          <p>
            When you connect Instagram or Facebook, Meldrune receives messages
            through Meta&apos;s official APIs and sends replies you approve
            through the same APIs. Meta&apos;s own privacy rules also apply to
            those messages. You can disconnect a channel at any time from
            Setup → Channels; disconnecting deletes the stored token, and
            Meldrune stops receiving new messages from that channel.
          </p>

          <h2>Data deletion</h2>
          <p>
            You can ask us to delete your account and all of its data at any
            time — your workspace, knowledge base, conversations, and connected
            channel tokens. Contact the Meldrune team through the app and we
            will delete it and confirm once it is done.
          </p>

          <h2>Security</h2>
          <p>
            Passwords are hashed, social access tokens are encrypted before
            they are stored, and access to your workspace requires your login.
            No system is perfect, but we take reasonable steps to keep your
            data safe.
          </p>

          <h2>Changes</h2>
          <p>
            If this policy changes, we will update this page and the date at
            the top.
          </p>
        </div>
      </main>
    </>
  );
}
