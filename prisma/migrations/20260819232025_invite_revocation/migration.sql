-- DropIndex
DROP INDEX "Invite_groupId_key";

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Invite_groupId_idx" ON "Invite"("groupId");
