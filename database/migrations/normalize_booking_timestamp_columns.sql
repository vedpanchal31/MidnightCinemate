-- Normalize booking-related timestamp columns to snake_case.
-- Target tables: Timeslot, MovieBooking, BookingSeat.

DO $$
BEGIN
  -- Timeslot: rename camelCase columns when snake_case not present.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Timeslot' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Timeslot' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "Timeslot" RENAME COLUMN "createdAt" TO created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Timeslot' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Timeslot' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "Timeslot" RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
END $$;

-- Ensure Timeslot snake_case columns exist and are populated.
ALTER TABLE "Timeslot"
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3);

UPDATE "Timeslot"
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

ALTER TABLE "Timeslot"
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- MovieBooking: preserve snake_case and backfill from camelCase if it exists.
ALTER TABLE "MovieBooking"
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MovieBooking' AND column_name = 'createdAt'
  ) THEN
    UPDATE "MovieBooking"
    SET created_at = COALESCE(created_at, "createdAt");
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MovieBooking' AND column_name = 'updatedAt'
  ) THEN
    UPDATE "MovieBooking"
    SET updated_at = COALESCE(updated_at, "updatedAt");
  END IF;
END $$;

UPDATE "MovieBooking"
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

ALTER TABLE "MovieBooking"
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- BookingSeat: enforce snake_case defaults.
ALTER TABLE "BookingSeat"
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3);

UPDATE "BookingSeat"
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

ALTER TABLE "BookingSeat"
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Drop camelCase leftovers if present.
ALTER TABLE "Timeslot" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "Timeslot" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "MovieBooking" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "MovieBooking" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "BookingSeat" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "BookingSeat" DROP COLUMN IF EXISTS "updatedAt";

-- Single trigger function for updated_at maintenance.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_timeslot_set_updated_at ON "Timeslot";
CREATE TRIGGER trg_timeslot_set_updated_at
BEFORE UPDATE ON "Timeslot"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_moviebooking_set_updated_at ON "MovieBooking";
CREATE TRIGGER trg_moviebooking_set_updated_at
BEFORE UPDATE ON "MovieBooking"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_bookingseat_set_updated_at ON "BookingSeat";
CREATE TRIGGER trg_bookingseat_set_updated_at
BEFORE UPDATE ON "BookingSeat"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
