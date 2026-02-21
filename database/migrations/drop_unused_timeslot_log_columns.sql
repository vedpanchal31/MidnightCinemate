-- Remove no-longer-used fields from time slot API log
ALTER TABLE "TimeSlotApiLog"
  DROP COLUMN IF EXISTS endpoint,
  DROP COLUMN IF EXISTS error_message;
