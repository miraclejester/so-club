-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('TMDB');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'BOOK', 'GAME');

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "source" "MediaSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "coverImage" TEXT,
    "releaseDate" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_source_externalId_key" ON "MediaItem"("source", "externalId");
