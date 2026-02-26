-- Comprehensive Migration: Fix all column naming and trigger issues
-- This migration resolves all camelCase vs snake_case conflicts and fixes trigger functions

-- Step 1: Drop all existing triggers and functions to avoid conflicts
DROP TRIGGER IF EXISTS update_timeslot_updated_at ON "Timeslot";
DROP TRIGGER IF EXISTS update_moviebooking_updated_at ON "MovieBooking";
DROP TRIGGER IF EXISTS update_bookingseat_updated_at ON "BookingSeat";
DROP TRIGGER IF EXISTS set_timeslot_timestamps ON "Timeslot";
DROP TRIGGER IF EXISTS set_moviebooking_timestamps ON "MovieBooking";
DROP TRIGGER IF EXISTS set_bookingseat_timestamps ON "BookingSeat";
DROP TRIGGER IF EXISTS trg_timeslot_set_updated_at ON "Timeslot";
DROP TRIGGER IF EXISTS trg_moviebooking_set_updated_at ON "MovieBooking";
DROP TRIGGER IF EXISTS trg_bookingseat_set_updated_at ON "BookingSeat";
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

-- Drop all existing functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS set_timestamp_columns() CASCADE;
DROP FUNCTION IF EXISTS set_timestamp_columns_universal() CASCADE;
DROP FUNCTION IF EXISTS set_timestamp_columns_smart() CASCADE;
DROP FUNCTION IF EXISTS update_user_timestamp_column() CASCADE;

-- Step 2: Recreate Timeslot table with proper snake_case columns
DROP TABLE IF EXISTS "Timeslot" CASCADE;

CREATE TABLE "Timeslot" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    screen_type VARCHAR(10) DEFAULT '2D' CHECK (screen_type IN ('2D', '3D', 'IMAX', '4DX')),
    show_date DATE DEFAULT CURRENT_DATE,
    total_seats INTEGER DEFAULT 100,
    available_seats INTEGER DEFAULT 100,
    tmdb_movie_id INTEGER
);

-- Step 3: Recreate MovieBooking table with proper snake_case columns
DROP TABLE IF EXISTS "MovieBooking" CASCADE;

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

-- Step 4: Recreate BookingSeat table with proper snake_case columns
DROP TABLE IF EXISTS "BookingSeat" CASCADE;

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

-- Step 5: Create all necessary indexes
-- Timeslot indexes
CREATE INDEX IF NOT EXISTS idx_timeslot_tmdb_movie_id ON "Timeslot"(tmdb_movie_id);
CREATE INDEX IF NOT EXISTS idx_timeslot_show_date ON "Timeslot"(show_date);
CREATE INDEX IF NOT EXISTS idx_timeslot_active ON "Timeslot"(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_timeslot_screen_type ON "Timeslot"(screen_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_movie_date_time_screen_unique
ON "Timeslot"(tmdb_movie_id, show_date, start_time, screen_type)
WHERE tmdb_movie_id IS NOT NULL;

-- MovieBooking indexes
CREATE INDEX IF NOT EXISTS idx_movie_booking_movie_date_time ON "MovieBooking"(tmdb_movie_id, show_date, show_time);
CREATE INDEX IF NOT EXISTS idx_movie_booking_timeslot_id ON "MovieBooking"(timeslot_id);
CREATE INDEX IF NOT EXISTS idx_movie_booking_stripe_session_id 
ON "MovieBooking"(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movie_booking_stripe_payment_id 
ON "MovieBooking"(stripe_payment_id) 
WHERE stripe_payment_id IS NOT NULL;

-- BookingSeat indexes
CREATE INDEX IF NOT EXISTS idx_booking_seat_booking_id ON "BookingSeat"(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_seat_active_unique
ON "BookingSeat"(tmdb_movie_id, timeslot_id, seat_id)
WHERE status IN (1, 2);

-- Step 6: Add foreign key constraints
ALTER TABLE "BookingSeat" 
ADD CONSTRAINT fk_bookingseat_booking_id 
FOREIGN KEY (booking_id) REFERENCES "MovieBooking"(id) ON DELETE CASCADE;

-- Step 7: Add table constraints
-- Timeslot constraints
ALTER TABLE "Timeslot" 
ADD CONSTRAINT check_timeslot_seats 
    CHECK (available_seats >= 0 AND available_seats <= total_seats);

ALTER TABLE "Timeslot" 
ADD CONSTRAINT check_timeslot_total_seats 
    CHECK (total_seats > 0);

-- MovieBooking constraints
ALTER TABLE "MovieBooking" 
ADD CONSTRAINT check_screen_type 
CHECK (screen_type IN ('2D', '3D', 'IMAX', '4DX'));

ALTER TABLE "MovieBooking" 
ADD CONSTRAINT unique_movie_slot_seat 
UNIQUE (tmdb_movie_id, timeslot_id, seat_id);

-- Step 8: Create trigger functions for each table
-- Timeslot trigger functions
CREATE OR REPLACE FUNCTION update_timeslot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_timeslot_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- MovieBooking trigger functions
CREATE OR REPLACE FUNCTION update_moviebooking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_moviebooking_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- BookingSeat trigger functions
CREATE OR REPLACE FUNCTION update_bookingseat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_bookingseat_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- User table trigger function (uses camelCase columns)
CREATE OR REPLACE FUNCTION update_user_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create all triggers
-- Timeslot triggers
CREATE TRIGGER update_timeslot_updated_at 
    BEFORE UPDATE ON "Timeslot" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timeslot_updated_at();

CREATE TRIGGER set_timeslot_timestamps
    BEFORE INSERT ON "Timeslot"
    FOR EACH ROW
    EXECUTE FUNCTION set_timeslot_timestamps();

-- MovieBooking triggers
CREATE TRIGGER update_moviebooking_updated_at 
    BEFORE UPDATE ON "MovieBooking" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_moviebooking_updated_at();

CREATE TRIGGER set_moviebooking_timestamps
    BEFORE INSERT ON "MovieBooking"
    FOR EACH ROW
    EXECUTE FUNCTION set_moviebooking_timestamps();

-- BookingSeat triggers
CREATE TRIGGER update_bookingseat_updated_at 
    BEFORE UPDATE ON "BookingSeat" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_bookingseat_updated_at();

CREATE TRIGGER set_bookingseat_timestamps
    BEFORE INSERT ON "BookingSeat"
    FOR EACH ROW
    EXECUTE FUNCTION set_bookingseat_timestamps();

-- User table trigger
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp_column();

-- Step 10: Update index references in existing tables
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_movie_date_time_screen_unique
ON "Timeslot"(tmdb_movie_id, show_date, start_time, screen_type)
WHERE tmdb_movie_id IS NOT NULL;

-- Migration completed successfully!
