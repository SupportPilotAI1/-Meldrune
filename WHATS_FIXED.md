# What was broken — and what's fixed (Nov 6, 2026)

## Bug 1 — the setup killer (FIXED)
`prisma/schema.prisma` had the `generator` and `datasource` blocks written as one-liners:

```
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite", url = env("DATABASE_URL") }
```

Prisma's parser does not accept single-line blocks — it treats everything after as
still being inside the generator. Result: `npx prisma migrate dev` (step 3 of the
README) failed instantly with 9 validation errors, so the app could never be set up
at all. Fixed by expanding both blocks to the standard multi-line format. Schema now
validates, generates, and migrates cleanly.

## Bug 2 — login dies in production mode (FIXED)
Auth.js v5 refuses to trust the host when the app runs with `npm start` (production)
outside Vercel unless told otherwise. Login returned a 500
("server configuration" / UntrustedHost) and no session was created.
Fixed by adding `trustHost: true` in `lib/auth.ts`. Login verified end-to-end:
session is issued and the dashboard loads.

## Verified working
- `npm install`, `prisma validate / generate / migrate dev`, `next build` — all clean
- Landing, login, and register pages render
- Visiting /app while logged out redirects to /login
- Credentials login issues a real session; dashboard shows the workspace + counts
- Database reads/writes (users, workspaces, FAQs, conversations, messages)

## Run it
```bash
cp .env.example .env   # set AUTH_SECRET to a long random string
npm install
npx prisma migrate dev --name init
npm run dev            # http://localhost:3000 — create an account and you're in
```

## Notes
- No `OPENAI_API_KEY` needed to test: the AI draft button falls back to a safe
  built-in draft. Add a key in `.env` when you want real AI drafts.
- Replies are saved inside Meldrune only — this MVP does not send email/social
  messages yet (see the README's production list before charging anyone).
