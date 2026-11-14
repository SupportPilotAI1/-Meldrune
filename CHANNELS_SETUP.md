# Connecting Instagram & Facebook DMs to Meldrune

Plain-language setup guide. Nothing here needs code — it is all clicking
around in dashboards. Do these steps in order. Estimated time: the clicking
takes about an hour; Meta's approval then takes roughly 2–3 weeks.

## What this unlocks

When a customer DMs the business on Instagram or Facebook, the message
lands in that business's Meldrune inbox, and replies sent from Meldrune go
back out to the customer. One Meta app covers both platforms. Meta's rules:
you can only reply to people who message first, and only within 24 hours of
their last message.

## Step 0 — Apply the database update (do this first)

The new code needs two new columns and one new table in the database.

1. Open Neon (the database) → open the Meldrune project → SQL Editor.
2. Open the file `prisma/migrations/20261114_trial_and_channels/migration.sql`
   in the GitHub repo and copy the whole thing into the SQL Editor.
3. Run it. It only adds things — it does not change or delete any existing
   data (RTL Records and its conversations are untouched).
4. If it says it ran fine, the database is ready. (You can also run
   `npx prisma migrate deploy` from a computer that has DATABASE_URL set.)

Until this runs, the app will still load, but anything that touches
workspaces will error — so do this step before testing the new code live.

## Step 1 — Create the Meta developer app

1. Go to https://developers.facebook.com and log in with the Facebook
   account that owns the business Page.
2. **My Apps → Create App.** Choose the **Business** type. Name it
   "Meldrune". (The name is what businesses will see when they connect.)
3. In the app dashboard, go to **Add Products** and add:
   - **Messenger** (for Facebook Page messages)
   - **Instagram** (for Instagram DMs)
4. In **App Settings → Basic**, copy two values somewhere safe (your own
   notes, never chat):
   - **App ID** → this is `META_APP_ID`
   - **App Secret** (click Show) → this is `META_APP_SECRET`
5. Set the **Privacy Policy URL** to `https://meldrune.vercel.app/privacy`
   and the **App Domains** to `meldrune.vercel.app`. (The privacy page is
   already live in the app.)

## Step 2 — Set the webhook

This is how Meta delivers new messages to Meldrune.

1. In the Messenger product settings, find **Webhooks → Add Callback URL**.
2. Callback URL: `https://meldrune.vercel.app/api/webhooks/meta`
3. Verify token: invent any random string (for example a few random words)
   and write it down — this is `META_VERIFY_TOKEN`. It must match exactly
   what you put in Vercel later.
4. Click **Verify and Save**. Meta will call the URL once to check it.
   If it fails, check that the verify token matches and try again.
5. After it verifies, subscribe the webhook to these fields:
   `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads`.
6. Do the same in the Instagram product settings (same callback URL and
   verify token, subscribe to `messages`).

## Step 3 — Add the secrets to Vercel

In Vercel → meldrune project → **Settings → Environment Variables**,
add these for **Production** (paste them yourself, never through chat):

| Key | Value |
| --- | --- |
| `META_APP_ID` | from Step 1 |
| `META_APP_SECRET` | from Step 1 |
| `META_VERIFY_TOKEN` | the string you invented in Step 2 |
| `META_API_VERSION` | `v21.0` |
| `META_TOKEN_ENCRYPTION_KEY` | a fresh 32-byte key — see below |

To make the encryption key, run this on any computer terminal:
`openssl rand -base64 32` — paste the whole output as the value.

Then redeploy: **Deployments → latest → Redeploy** and wait for Ready.
Env changes do not apply until a new deployment runs.

## Step 4 — Test it yourself first

1. Log in to Meldrune, go to **Setup → Channels**.
2. Click **Connect Facebook** and log in with the Facebook account that
   owns a Page. Pick the Page. You should land back on Channels showing
   "Connected".
3. If the Page has an Instagram business account linked, Instagram shows
   as connected too.
4. Send the Page (or Instagram account) a DM from a different account.
   It should appear in the Meldrune inbox. Reply from Meldrune — the
   reply should arrive in the DM thread.

This works right away in **test mode**, but only for Facebook accounts that
have a role on the Meta app (you, and anyone you add under Roles). Real
businesses cannot connect yet — that needs Step 5.

## Step 5 — Meta App Review + Business Verification

This is the part that takes weeks. Both are done in Meta's dashboard.

**Business Verification** (proves Meldrune is a real business):
1. In Meta Business Suite → **Business Settings → Business Info**.
2. Meta will ask for business documents — this is where the LLC and any
   business license come in. The business must be a real registered
   entity (a registered LLC with its paperwork is the usual path).
3. This usually takes 2–5 business days, sometimes up to 14.

**App Review** (proves the app uses the permissions properly):
1. In the developer app → **App Review → Permissions and Features**,
   request **Advanced Access** for: `pages_messaging`,
   `pages_manage_metadata`, `instagram_manage_messages`.
2. For each one, Meta asks for a screencast: record your phone screen
   showing a DM arriving in Meldrune and a reply going back out, and
   explain in plain words what the app does. Also give Meta a test login
   (a Meldrune account they can sign in with).
3. Most reviews land within about 20 days.

Once both pass, any business can connect its Page / Instagram from
Setup → Channels — no more test-mode limits.

## What the code already does (so you know)

- Webhook endpoint `app/api/webhooks/meta/` — verifies Meta's handshake,
  checks every delivery's signature, answers 200 fast, then saves the
  message into the right workspace's inbox (duplicates ignored).
- OAuth connect flow `app/api/meta/connect` + `app/api/meta/callback` —
  exchanges the login code for long-lived tokens and stores them encrypted
  (AES-GCM) in the `Channel` table.
- Replies from the inbox are also sent out through Meta, but only inside
  the 24-hour reply window; outside it the app refuses with a plain message.
- Free trial: new workspaces get 14 days, shown as a banner in the app.
  There is no paywall yet — when billing is added, `plan` flips to "paid".
