-- CreateTable
CREATE TABLE "quote_drafts" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATE NOT NULL,
    "service" TEXT NOT NULL,
    "taxMode" TEXT,
    "appliedTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerTaxId" TEXT NOT NULL DEFAULT '',
    "customerAddress" TEXT NOT NULL DEFAULT '',
    "customerContact" TEXT NOT NULL DEFAULT '',
    "companyName" TEXT NOT NULL,
    "companyTaxId" TEXT NOT NULL DEFAULT '',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyBankDetails" TEXT NOT NULL DEFAULT '',
    "materials" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "paymentConditions" TEXT NOT NULL DEFAULT '',
    "validityConditions" TEXT NOT NULL DEFAULT '',
    "executionConditions" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_draft_items" (
    "id" TEXT NOT NULL,
    "quoteDraftId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitCode" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "quote_draft_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_drafts_status_updatedAt_idx" ON "quote_drafts"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "quote_drafts_customerName_idx" ON "quote_drafts"("customerName");

-- CreateIndex
CREATE UNIQUE INDEX "quote_draft_items_quoteDraftId_position_key" ON "quote_draft_items"("quoteDraftId", "position");

-- CreateIndex
CREATE INDEX "quote_draft_items_quoteDraftId_idx" ON "quote_draft_items"("quoteDraftId");

-- AddForeignKey
ALTER TABLE "quote_drafts" ADD CONSTRAINT "quote_drafts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_drafts" ADD CONSTRAINT "quote_drafts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_drafts" ADD CONSTRAINT "quote_drafts_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_draft_items" ADD CONSTRAINT "quote_draft_items_quoteDraftId_fkey" FOREIGN KEY ("quoteDraftId") REFERENCES "quote_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
