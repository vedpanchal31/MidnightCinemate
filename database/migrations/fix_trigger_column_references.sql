-- Fix trigger functions to use correct snake_case column names
-- This migration resolves the "record 'new' has no field 'createdAt'" error

-- Drop ALL existing triggers first to ensure no old references remain
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

-- Drop any existing functions to avoid conflicts (use CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS set_timestamp_columns() CASCADE;
DROP FUNCTION IF EXISTS set_timestamp_columns_universal() CASCADE;
DROP FUNCTION IF EXISTS set_timestamp_columns_smart() CASCADE;
DROP FUNCTION IF EXISTS update_user_timestamp_column() CASCADE;

-- Update the trigger function to use snake_case column names
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function for setting both created_at and updated_at on INSERT
CREATE OR REPLACE FUNCTION set_timestamp_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create separate function for User table since it uses camelCase columns
CREATE OR REPLACE FUNCTION update_user_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create smart INSERT function that checks column existence
CREATE OR REPLACE FUNCTION set_timestamp_columns_smart()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if snake_case columns exist and set them
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME AND column_name = 'created_at'
    ) THEN
        NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);
    END IF;
    
    -- Check if camelCase columns exist and set them
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME AND column_name = 'createdAt'
    ) THEN
        NEW."createdAt" = COALESCE(NEW."createdAt", CURRENT_TIMESTAMP);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME AND column_name = 'updatedAt'
    ) THEN
        NEW."updatedAt" = COALESCE(NEW."updatedAt", CURRENT_TIMESTAMP);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate all UPDATE triggers to ensure they use the updated function
CREATE TRIGGER update_timeslot_updated_at 
    BEFORE UPDATE ON "Timeslot" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moviebooking_updated_at 
    BEFORE UPDATE ON "MovieBooking" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookingseat_updated_at 
    BEFORE UPDATE ON "BookingSeat" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create INSERT triggers for tables that need created_at set
CREATE TRIGGER set_timeslot_timestamps
    BEFORE INSERT ON "Timeslot"
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp_columns_smart();

CREATE TRIGGER set_moviebooking_timestamps
    BEFORE INSERT ON "MovieBooking"
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp_columns_smart();

CREATE TRIGGER set_bookingseat_timestamps
    BEFORE INSERT ON "BookingSeat"
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp_columns_smart();

-- Handle User table separately since it still uses camelCase columns
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp_column();
