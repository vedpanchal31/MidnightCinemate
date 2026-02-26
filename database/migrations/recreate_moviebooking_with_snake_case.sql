-- Recreate MovieBooking table with proper snake_case columns
-- This migration drops and recreates the MovieBooking table to ensure consistent naming

-- Drop the existing MovieBooking table
DROP TABLE IF EXISTS "MovieBooking" CASCADE;

-- Create MovieBooking table with proper snake_case columns
CREATE TABLE "MovieBooking" (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    tmdb_movie_id INTEGER NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    seat_id VARCHAR(10),
    price DECIMAL(10, 2) NOT NULL,
    status INTEGER DEFAULT 1, -- 1: pending, 2: confirmed, 3: cancelled, 4: refunded, 5: expired, 6: failed
    timeslot_id UUID,
    stripe_session_id TEXT,
    stripe_payment_id TEXT,
    screen_type VARCHAR(10) DEFAULT '2D',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_movie_booking_movie_date_time ON "MovieBooking"(tmdb_movie_id, show_date, show_time);
CREATE INDEX IF NOT EXISTS idx_movie_booking_timeslot_id ON "MovieBooking"(timeslot_id);
CREATE INDEX IF NOT EXISTS idx_movie_booking_stripe_session_id 
ON "MovieBooking"(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movie_booking_stripe_payment_id 
ON "MovieBooking"(stripe_payment_id) 
WHERE stripe_payment_id IS NOT NULL;

-- Add constraints
ALTER TABLE "MovieBooking" 
ADD CONSTRAINT check_screen_type 
CHECK (screen_type IN ('2D', '3D', 'IMAX', '4DX'));

-- Add unique constraint for movie bookings
ALTER TABLE "MovieBooking" 
ADD CONSTRAINT unique_movie_slot_seat 
UNIQUE (tmdb_movie_id, timeslot_id, seat_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_moviebooking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for MovieBooking
CREATE TRIGGER update_moviebooking_updated_at 
    BEFORE UPDATE ON "MovieBooking" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_moviebooking_updated_at();

-- Create trigger for setting timestamps on insert
CREATE OR REPLACE FUNCTION set_moviebooking_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_moviebooking_timestamps
    BEFORE INSERT ON "MovieBooking"
    FOR EACH ROW
    EXECUTE FUNCTION set_moviebooking_timestamps();
