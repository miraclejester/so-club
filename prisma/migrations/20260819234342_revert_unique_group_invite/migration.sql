/*
  Warnings:

  - A unique constraint covering the columns `[groupId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Invite_groupId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Invite_groupId_key" ON "Invite"("groupId");
