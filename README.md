# Meldrune — AI Conversation Operating System

A runnable MVP codebase for small-business customer support: business setup, knowledge-base FAQs,
conversation inbox, manual replies, and knowledge-grounded AI reply drafting.

## Stack
- Next.js App Router + TypeScript
- Prisma ORM + SQLite for local development (switch `DATABASE_URL` to PostgreSQL for deployment)
- Auth.js credentials login with bcrypt password hashes
- OpenAI API for optional AI reply drafting (falls back to a deterministic draft if no key is configured)

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set `AUTH_SECRET` to a long random value.
3. Run:
   ```bash
   npm install
   npx prisma migrate dev --name init
   npm run dev
   ```
4. Open http://localhost:3000 and create an account.

The first account creates its own isolated workspace. Add FAQs in Knowledge, create or open conversations
in Inbox, and use “Generate AI draft” to compose a grounded response.

## Important production work
This is a complete runnable MVP foundation, not a claim that every external integration is already connected.
Before charging customers, configure a production PostgreSQL database, HTTPS, email verification/password
reset, rate limiting, backups, monitoring, a data-processing/privacy policy, and Stripe billing/webhooks.
Connect Gmail/Outlook, Shopify, SMS, and social channels through their official OAuth/webhook APIs.
Never expose `OPENAI_API_KEY`, `AUTH_SECRET`, or database credentials to the browser.
