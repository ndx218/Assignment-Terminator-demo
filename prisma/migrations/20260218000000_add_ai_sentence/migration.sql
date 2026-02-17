-- CreateTable
CREATE TABLE "AiSentence" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "aiPercent" INTEGER,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSentence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiSentence_createdAt_idx" ON "AiSentence"("createdAt");
