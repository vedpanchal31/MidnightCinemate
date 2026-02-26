-- Recreate BookingSeat table with proper snake_case columns
-- This migration drops and recreates the BookingSeat table to ensure consistent naming

-- Drop the existing BookingSeat table
DROP TABLE IF EXISTS "BookingSeat" CASCADE;

-- Create BookingSeat table with proper snake_case columns
CREATE TABLE "BookingSeat" (
    id BIGSERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    tmdb_movie_id INTEGER NOT NULL,
    timeslot_id UUID NOT NULL,
    seat_id VARCHAR(10) NOT NULL,
    status INTEGER NOT NULL DEFAULT 1, -- 1: pending, 2: confirmed, 3: cancelled, 4: refunded, 5: expired, 6: failed
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE "BookingSeat" 
ADD CONSTRAINT fk_bookingseat_booking_id 
FOREIGN KEY (booking_id) REFERENCES "MovieBooking"(id) ON DELETE CASCADE;

-- Create indexes for BookingSeat
CREATE INDEX IF NOT EXISTS idx_booking_seat_booking_id ON "BookingSeat"(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_seat_active_unique
ON "BookingSeat"(tmdb_movie_id, timeslot_id, seat_id)
WHERE status IN (1, 2);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_bookingseat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for BookingSeat
CREATE TRIGGER update_bookingseat_updated_at 
    BEFORE UPDATE ON "BookingSeat" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_bookingseat_updated_at();

-- Create trigger for setting timestamps on insert
CREATE OR REPLACE FUNCTION set_bookingseat_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_bookingseat_timestamps
    BEFORE INSERT ON "BookingSeat"
    FOR EACH ROW
    EXECUTE FUNCTION set_bookingseat_timestamps();
