-- CreateTable
CREATE TABLE "AdminLoginCode" (
    "id" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminLoginCode_adminId_idx" ON "AdminLoginCode"("adminId");
