-- DropIndex
DROP INDEX "idx_conversion_created_by";

-- CreateIndex
CREATE INDEX "idx_conversion_owner_active" ON "Conversion"("createdBy", "deletedAt");
