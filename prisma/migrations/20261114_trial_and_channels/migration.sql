-- Meldrune: free trial fields + Meta DM channels (Instagram / Facebook)
-- Apply this file in the Neon SQL Editor (or: npx prisma migrate deploy)
-- BEFORE the new code is used in production. It only adds columns and one
-- new table; it does not change or delete any existing data. Existing
-- workspaces (e.g. RTL Records) keep plan="trial" with no end date, which
-- the app shows as an open-ended free trial.

ALTER TABLE "Workspace" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE "Workspace" ADD COLUMN "trialEndsAt" TIMESTAMP(3);

CREATE TABLE "Channel" (
  "id" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "externalAccountId" TEXT NOT NULL,
  "displayName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'connected',
  "accessTokenEnc" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "webhookSubscribed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "workspaceId" TEXT NOT NULL,
  CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Channel_workspaceId_platform_externalAccountId_key" ON "Channel"("workspaceId", "platform", "externalAccountId");
CREATE INDEX "Channel_workspaceId_idx" ON "Channel"("workspaceId");
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD COLUMN "channelId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "externalThreadId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "externalSenderId" TEXT;
CREATE INDEX "Conversation_channelId_idx" ON "Conversation"("channelId");
CREATE INDEX "Conversation_externalThreadId_idx" ON "Conversation"("externalThreadId");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Message" ADD COLUMN "externalMessageId" TEXT;
CREATE UNIQUE INDEX "Message_externalMessageId_key" ON "Message"("externalMessageId");
