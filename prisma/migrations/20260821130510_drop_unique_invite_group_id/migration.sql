-- DropIndex
DROP INDEX "Invite_groupId_key";

-- CreateIndex
CREATE INDEX "Invite_groupId_idx" ON "Invite"("groupId");
