-- Recreate Timeslot table with proper snake_case columns
-- This migration drops and recreates the Timeslot table to ensure consistent naming

-- Drop the existing Timeslot table
DROP TABLE IF EXISTS "Timeslot" CASCADE;

-- Create Timeslot table with proper snake_case columns
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timeslot_tmdb_movie_id ON "Timeslot"(tmdb_movie_id);
CREATE INDEX IF NOT EXISTS idx_timeslot_show_date ON "Timeslot"(show_date);
CREATE INDEX IF NOT EXISTS idx_timeslot_active ON "Timeslot"(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_timeslot_screen_type ON "Timeslot"(screen_type);

-- Add constraints
ALTER TABLE "Timeslot" 
ADD CONSTRAINT check_timeslot_seats 
    CHECK (available_seats >= 0 AND available_seats <= total_seats);

ALTER TABLE "Timeslot" 
ADD CONSTRAINT check_timeslot_total_seats 
    CHECK (total_seats > 0);

-- Create unique index for Timeslot
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_movie_date_time_screen_unique
ON "Timeslot"(tmdb_movie_id, show_date, start_time, screen_type)
WHERE tmdb_movie_id IS NOT NULL;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_timeslot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for Timeslot
CREATE TRIGGER update_timeslot_updated_at 
    BEFORE UPDATE ON "Timeslot" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timeslot_updated_at();

-- Create trigger for setting timestamps on insert
CREATE OR REPLACE FUNCTION set_timeslot_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_timeslot_timestamps
    BEFORE INSERT ON "Timeslot"
    FOR EACH ROW
    EXECUTE FUNCTION set_timeslot_timestamps();
