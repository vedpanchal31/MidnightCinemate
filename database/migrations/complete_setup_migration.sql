-- Comprehensive Setup Migration for Fresh Local Installation
-- This migration creates all necessary tables with proper column naming and triggers

-- Step 1: Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    is_email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create OTP table
CREATE TABLE IF NOT EXISTS "OTP" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create Timeslot table
CREATE TABLE IF NOT EXISTS "Timeslot" (
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

-- Step 4: Create MovieBooking table
CREATE TABLE IF NOT EXISTS "MovieBooking" (
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

-- Step 5: Create BookingSeat table
CREATE TABLE IF NOT EXISTS "BookingSeat" (
    id BIGSERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    tmdb_movie_id INTEGER NOT NULL,
    timeslot_id UUID NOT NULL,
    seat_id VARCHAR(10) NOT NULL,
    status INTEGER NOT NULL DEFAULT 1, -- 1: pending, 2: confirmed, 3: cancelled, 4: refunded, 5: expired, 6: failed
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 6: Create TimeSlotApiLog table
CREATE TABLE IF NOT EXISTS "TimeSlotApiLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tmdb_movie_id INTEGER NOT NULL,
    show_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    screen_type VARCHAR(10) DEFAULT '2D',
    total_seats INTEGER DEFAULT 100,
    api_response JSONB,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_reset_token ON "User"(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_otp_email ON "OTP"(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON "OTP"(expires_at);

CREATE INDEX IF NOT EXISTS idx_timeslot_tmdb_movie_id ON "Timeslot"(tmdb_movie_id);
CREATE INDEX IF NOT EXISTS idx_timeslot_show_date ON "Timeslot"(show_date);
CREATE INDEX IF NOT EXISTS idx_timeslot_active ON "Timeslot"(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_timeslot_screen_type ON "Timeslot"(screen_type);

CREATE INDEX IF NOT EXISTS idx_movie_booking_movie_date_time ON "MovieBooking"(tmdb_movie_id, show_date, show_time);
CREATE INDEX IF NOT EXISTS idx_movie_booking_timeslot_id ON "MovieBooking"(timeslot_id);
CREATE INDEX IF NOT EXISTS idx_movie_booking_stripe_session_id ON "MovieBooking"(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movie_booking_stripe_payment_id ON "MovieBooking"(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booking_seat_booking_id ON "BookingSeat"(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seat_active_unique ON "BookingSeat"(tmdb_movie_id, timeslot_id, seat_id) WHERE status IN (1, 2);

CREATE INDEX IF NOT EXISTS idx_timeslot_api_log_movie_date ON "TimeSlotApiLog"(tmdb_movie_id, show_date);
CREATE INDEX IF NOT EXISTS idx_timeslot_api_log_created_at ON "TimeSlotApiLog"(created_at);

-- Step 7: Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_movie_date_time_screen_unique
ON "Timeslot"(tmdb_movie_id, show_date, start_time, screen_type)
WHERE tmdb_movie_id IS NOT NULL;

ALTER TABLE "MovieBooking"
ADD CONSTRAINT IF NOT EXISTS unique_movie_slot_seat
UNIQUE (tmdb_movie_id, timeslot_id, seat_id);

-- Step 8: Add constraints
ALTER TABLE "Timeslot"
ADD CONSTRAINT IF NOT EXISTS check_timeslot_seats
CHECK (available_seats >= 0 AND available_seats <= total_seats);

ALTER TABLE "Timeslot"
ADD CONSTRAINT IF NOT EXISTS check_timeslot_total_seats
CHECK (total_seats > 0);

ALTER TABLE "MovieBooking"
ADD CONSTRAINT IF NOT EXISTS check_screen_type
CHECK (screen_type IN ('2D', '3D', 'IMAX', '4DX'));

-- Step 9: Add foreign key constraints
ALTER TABLE "BookingSeat"
ADD CONSTRAINT IF NOT EXISTS fk_bookingseat_booking_id
FOREIGN KEY (booking_id) REFERENCES "MovieBooking"(id) ON DELETE CASCADE;

-- Step 10: Create trigger functions for updated_at columns
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_timeslot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_moviebooking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_bookingseat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_timeslot_api_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 11: Create trigger functions for setting timestamps on insert
CREATE OR REPLACE FUNCTION set_user_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
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

CREATE OR REPLACE FUNCTION set_moviebooking_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
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

CREATE OR REPLACE FUNCTION set_timeslot_api_log_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 12: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
DROP TRIGGER IF EXISTS set_user_timestamps ON "User";
DROP TRIGGER IF EXISTS update_timeslot_updated_at ON "Timeslot";
DROP TRIGGER IF EXISTS set_timeslot_timestamps ON "Timeslot";
DROP TRIGGER IF EXISTS update_moviebooking_updated_at ON "MovieBooking";
DROP TRIGGER IF EXISTS set_moviebooking_timestamps ON "MovieBooking";
DROP TRIGGER IF EXISTS update_bookingseat_updated_at ON "BookingSeat";
DROP TRIGGER IF EXISTS set_bookingseat_timestamps ON "BookingSeat";
DROP TRIGGER IF EXISTS update_timeslot_api_log_updated_at ON "TimeSlotApiLog";
DROP TRIGGER IF EXISTS set_timeslot_api_log_timestamps ON "TimeSlotApiLog";

-- Step 13: Create all triggers
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

CREATE TRIGGER set_user_timestamps
    BEFORE INSERT ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION set_user_timestamps();

CREATE TRIGGER update_timeslot_updated_at 
    BEFORE UPDATE ON "Timeslot" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timeslot_updated_at();

CREATE TRIGGER set_timeslot_timestamps
    BEFORE INSERT ON "Timeslot"
    FOR EACH ROW
    EXECUTE FUNCTION set_timeslot_timestamps();

CREATE TRIGGER update_moviebooking_updated_at 
    BEFORE UPDATE ON "MovieBooking" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_moviebooking_updated_at();

CREATE TRIGGER set_moviebooking_timestamps
    BEFORE INSERT ON "MovieBooking"
    FOR EACH ROW
    EXECUTE FUNCTION set_moviebooking_timestamps();

CREATE TRIGGER update_bookingseat_updated_at 
    BEFORE UPDATE ON "BookingSeat" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_bookingseat_updated_at();

CREATE TRIGGER set_bookingseat_timestamps
    BEFORE INSERT ON "BookingSeat"
    FOR EACH ROW
    EXECUTE FUNCTION set_bookingseat_timestamps();

CREATE TRIGGER update_timeslot_api_log_updated_at
    BEFORE UPDATE ON "TimeSlotApiLog"
    FOR EACH ROW
    EXECUTE FUNCTION update_timeslot_api_log_updated_at();

CREATE TRIGGER set_timeslot_api_log_timestamps
    BEFORE INSERT ON "TimeSlotApiLog"
    FOR EACH ROW
    EXECUTE FUNCTION set_timeslot_api_log_timestamps();

-- Step 14: Create sample data (optional - can be commented out for production)
-- Sample user (password: 'password123' hashed with bcrypt)
INSERT INTO "User" (id, email, password, name, phone, is_email_verified, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'test@example.com',
    '$2a$10$rQZ8kHWKm/PqZwZ.6LzO1OaPQz8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8',
    'Test User',
    '+1234567890',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Sample timeslot
INSERT INTO "Timeslot" (tmdb_movie_id, show_date, start_time, end_time, screen_type, total_seats, available_seats, is_active, created_at, updated_at)
VALUES (
    1407523,
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    '13:00:00',
    '2D',
    100,
    100,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Step 15: Verification queries
SELECT 'User table created successfully' as status FROM "User" LIMIT 1;
SELECT 'Timeslot table created successfully' as status FROM "Timeslot" LIMIT 1;
SELECT 'MovieBooking table created successfully' as status FROM "MovieBooking" LIMIT 1;
SELECT 'BookingSeat table created successfully' as status FROM "BookingSeat" LIMIT 1;
SELECT 'OTP table created successfully' as status FROM "OTP" LIMIT 1;
SELECT 'TimeSlotApiLog table created successfully' as status FROM "TimeSlotApiLog" LIMIT 1;
