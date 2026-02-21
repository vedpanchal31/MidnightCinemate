-- Create Timeslot table for managing movie show times
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timeslot_tmdb_movie_id ON "Timeslot"(tmdb_movie_id);
CREATE INDEX IF NOT EXISTS idx_timeslot_show_date ON "Timeslot"(show_date);
CREATE INDEX IF NOT EXISTS "idx_timeslot_active" ON "Timeslot"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_timeslot_screen_type" ON "Timeslot"(screen_type);

-- Add constraints
ALTER TABLE "Timeslot" DROP CONSTRAINT IF EXISTS check_available_seats;
ALTER TABLE "Timeslot" ADD CONSTRAINT check_timeslot_seats 
    CHECK (available_seats >= 0 AND available_seats <= total_seats);

ALTER TABLE "Timeslot" DROP CONSTRAINT IF EXISTS check_total_seats;
ALTER TABLE "Timeslot" ADD CONSTRAINT check_timeslot_total_seats 
    CHECK (total_seats > 0);

-- Trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_timeslot_updated_at ON "Timeslot";
CREATE TRIGGER update_timeslot_updated_at 
    BEFORE UPDATE ON "Timeslot" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
