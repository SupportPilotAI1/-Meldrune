# Meldrune — going live on the internet (the map)

Four steps. Lux prepped the code; your part is accounts + pasting, no coding.
Keep every password and connection string OUT of chat — you'll paste them into
the websites yourself. Lux never needs to see them.

## Step 1 — the database (Neon, free) — ~3 minutes
1. Go to **neon.tech** and sign up (Google sign-in is fastest).
2. Create a new project — name it `meldrune`. Pick the region closest to you (US East).
3. Neon shows you a **connection string** (starts with `postgresql://`). Save it in your
   notes/password manager. You'll need two versions later:
   - the **Pooled** one (host contains `-pooler`) → becomes `DATABASE_URL`
   - the **Direct** one (host without `-pooler`) → becomes `DIRECT_URL`
   Neon has a toggle for pooled vs direct on the connection-string box.

## Step 2 — create the tables (Neon SQL Editor) — ~2 minutes
1. In your Neon project, open **SQL Editor**.
2. Paste the entire contents of `neon-setup.sql` (it's in this project folder) and run it.
   It creates the User, Workspace, FAQ, Conversation, and Message tables.
   (If you're on your phone, tell Lux when you're at this step and you'll get the
   exact text to copy-paste.)

## Step 3 — put the code on GitHub (free) — ~5–10 minutes
1. Go to **github.com** and create an account if you don't have one.
2. Create a new repository named `meldrune` (public or private, either works).
3. Upload all the files from this project folder (everything except `node_modules`
   and `.next` if those folders exist — they're not in this zip anyway).
   Easiest on a computer (drag the whole folder's contents in). On a phone it's
   folder-by-folder — doable, just slower.

## Step 4 — deploy on Vercel (free) — ~5 minutes
1. Go to **vercel.com**, sign up **with your GitHub account**.
2. **Add New → Project**, pick the `meldrune` repo, and before hitting Deploy,
   open **Environment Variables** and add these three:
   - `DATABASE_URL` — your Neon **pooled** connection string
   - `DIRECT_URL` — your Neon **direct** connection string
   - `AUTH_SECRET` — a long random string you invent (keyboard smash is fine)
3. Hit **Deploy**. In about a minute you get your live link:
   `https://meldrune-xxxx.vercel.app` — open it on your phone, create your account,
   and Meldrune is on the internet.

## Notes
- No OpenAI key needed — add `OPENAI_API_KEY` later in Vercel's env vars when you
  want real AI drafts instead of the built-in fallback.
- The free tiers of Neon + Vercel + GitHub are enough to launch and test.
- A custom domain (like meldrune.com) can be attached in Vercel later — optional.
