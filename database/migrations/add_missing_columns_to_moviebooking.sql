-- Migration: Add missing columns to MovieBooking table
-- Run this in Supabase SQL Editor

-- Fix column naming inconsistencies (updatedAt vs updated_at)
DO $$
BEGIN
    -- Check if MovieBooking has updatedAt column and rename it to updated_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MovieBooking' 
        AND column_name = 'updatedAt'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MovieBooking' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "MovieBooking" RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
    
    -- Check if Timeslot has updatedAt column and rename it to updated_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Timeslot' 
        AND column_name = 'updatedAt'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Timeslot' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "Timeslot" RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
    
    -- Check if BookingSeat has updatedAt column and rename it to updated_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingSeat' 
        AND column_name = 'updatedAt'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BookingSeat' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "BookingSeat" RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- Add Stripe-related columns
ALTER TABLE "MovieBooking" 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- Add screen_type column if missing
ALTER TABLE "MovieBooking" 
ADD COLUMN IF NOT EXISTS screen_type VARCHAR(10) DEFAULT '2D';

-- Convert status column from VARCHAR to INTEGER (if not already done)
-- Check if column is still text type before converting
DO $$
BEGIN
    -- Check if status column is still text type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MovieBooking' 
        AND column_name = 'status' 
        AND data_type = 'character varying'
    ) THEN
        -- Update existing string values to integers
        UPDATE "MovieBooking" 
        SET status = CASE 
            WHEN status = '1' THEN 1
            WHEN status = '2' THEN 2
            WHEN status = '3' THEN 3
            WHEN status = '4' THEN 4
            WHEN status = '5' THEN 5
            WHEN status = '6' THEN 6
            WHEN status = 'confirmed' THEN 2
            WHEN status = 'pending' THEN 1
            WHEN status = 'cancelled' THEN 3
            WHEN status = 'refunded' THEN 4
            WHEN status = 'expired' THEN 5
            WHEN status = 'failed' THEN 6
            ELSE 1
        END;
        
        -- Then alter column type
        ALTER TABLE "MovieBooking" 
        ALTER COLUMN status TYPE INTEGER USING status::INTEGER;
        
        -- Set default status
        ALTER TABLE "MovieBooking" 
        ALTER COLUMN status SET DEFAULT 1;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_movie_booking_stripe_session_id 
ON "MovieBooking"(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movie_booking_stripe_payment_id 
ON "MovieBooking"(stripe_payment_id) 
WHERE stripe_payment_id IS NOT NULL;

-- Add constraints for screen_type (check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_screen_type' 
        AND table_name = 'MovieBooking'
    ) THEN
        ALTER TABLE "MovieBooking" 
        ADD CONSTRAINT check_screen_type 
        CHECK (screen_type IN ('2D', '3D', 'IMAX', '4DX'));
    END IF;
END $$;

-- Update seat_id to handle multiple seats (if needed)
ALTER TABLE "MovieBooking" 
ALTER COLUMN seat_id DROP DEFAULT;

-- Create BookingSeat table if not exists (for multiple seat support)
CREATE TABLE IF NOT EXISTS "BookingSeat" (
  id BIGSERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES "MovieBooking"(id) ON DELETE CASCADE,
  tmdb_movie_id INTEGER NOT NULL,
  timeslot_id UUID NOT NULL,
  seat_id VARCHAR(10) NOT NULL,
  status INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for BookingSeat
CREATE INDEX IF NOT EXISTS idx_booking_seat_booking_id ON "BookingSeat"(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_seat_active_unique
ON "BookingSeat"(tmdb_movie_id, timeslot_id, seat_id)
WHERE status IN (1, 2);

-- Create TimeSlotApiLog table if not exists
CREATE TABLE IF NOT EXISTS "TimeSlotApiLog" (
  id BIGSERIAL PRIMARY KEY,
  tmdb_movie_id INTEGER,
  date_from DATE,
  date_to DATE,
  request_payload JSONB,
  response_count INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique index for TimeSlotApiLog
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_api_log_tmdb_movie_id_unique
ON "TimeSlotApiLog"(tmdb_movie_id)
WHERE tmdb_movie_id IS NOT NULL;

-- Create Timeslot table if not exists
CREATE TABLE IF NOT EXISTS "Timeslot" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    screen_type VARCHAR(10) DEFAULT '2D' CHECK (screen_type IN ('2D', '3D', 'IMAX', '4DX')),
    show_date DATE DEFAULT CURRENT_DATE,
    total_seats INTEGER DEFAULT 100,
    available_seats INTEGER DEFAULT 100,
    tmdb_movie_id INTEGER
);

-- Add indexes for Timeslot
CREATE INDEX IF NOT EXISTS idx_timeslot_tmdb_movie_id ON "Timeslot"(tmdb_movie_id);
CREATE INDEX IF NOT EXISTS idx_timeslot_show_date ON "Timeslot"(show_date);
CREATE INDEX IF NOT EXISTS idx_timeslot_active ON "Timeslot"(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS "idx_timeslot_screen_type" ON "Timeslot"(screen_type);

-- Add constraints for Timeslot (check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_timeslot_seats' 
        AND table_name = 'Timeslot'
    ) THEN
        ALTER TABLE "Timeslot" 
        ADD CONSTRAINT check_timeslot_seats 
        CHECK (available_seats >= 0 AND available_seats <= total_seats);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_timeslot_total_seats' 
        AND table_name = 'Timeslot'
    ) THEN
        ALTER TABLE "Timeslot" 
        ADD CONSTRAINT check_timeslot_total_seats 
        CHECK (total_seats > 0);
    END IF;
END $$;

-- Create unique index for Timeslot
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_movie_date_time_screen_unique
ON "Timeslot"(tmdb_movie_id, show_date, start_time, screen_type)
WHERE tmdb_movie_id IS NOT NULL;

-- Create trigger function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for Timeslot
DROP TRIGGER IF EXISTS update_timeslot_updated_at ON "Timeslot";
CREATE TRIGGER update_timeslot_updated_at 
    BEFORE UPDATE ON "Timeslot" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for MovieBooking
DROP TRIGGER IF EXISTS update_moviebooking_updated_at ON "MovieBooking";
CREATE TRIGGER update_moviebooking_updated_at 
    BEFORE UPDATE ON "MovieBooking" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for BookingSeat
DROP TRIGGER IF EXISTS update_bookingseat_updated_at ON "BookingSeat";
CREATE TRIGGER update_bookingseat_updated_at 
    BEFORE UPDATE ON "BookingSeat" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at column to MovieBooking if missing
ALTER TABLE "MovieBooking" 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add unique constraint for movie bookings (check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_movie_slot_seat' 
        AND table_name = 'MovieBooking'
    ) THEN
        ALTER TABLE "MovieBooking" 
        ADD CONSTRAINT unique_movie_slot_seat 
        UNIQUE (tmdb_movie_id, timeslot_id, seat_id);
    END IF;
END $$;

-- Clean up old data in TimeSlotApiLog
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tmdb_movie_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM "TimeSlotApiLog"
  WHERE tmdb_movie_id IS NOT NULL
)
DELETE FROM "TimeSlotApiLog" l
USING ranked r
WHERE l.id = r.id AND r.rn > 1;
