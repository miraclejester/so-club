-- CreateEnum
CREATE TYPE "BacklogStatus" AS ENUM ('BACKLOG', 'SCHEDULED', 'IN_PROGRESS', 'FINISHED');

-- CreateTable
CREATE TABLE "BacklogItem" (
    "id" TEXT NOT NULL,
    "status" "BacklogStatus" NOT NULL DEFAULT 'BACKLOG',
    "order" INTEGER,
    "addedById" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BacklogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BacklogItem_groupId_mediaItemId_key" ON "BacklogItem"("groupId", "mediaItemId");

-- AddForeignKey
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
