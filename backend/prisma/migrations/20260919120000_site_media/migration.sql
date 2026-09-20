-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "bannerPosterUrl" TEXT,
ADD COLUMN     "bannerVideoUrl" TEXT;

-- CreateTable
CREATE TABLE "SiteMedia" (
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteMedia_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PlayerTrack" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerTrack_position_idx" ON "PlayerTrack"("position");
