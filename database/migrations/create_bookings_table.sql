-- Create MovieBooking table
CREATE TABLE IF NOT EXISTS "MovieBooking" (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  tmdb_movie_id INTEGER NOT NULL,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  seat_id VARCHAR(10) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  timeslot_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes and Constraints
CREATE INDEX IF NOT EXISTS idx_movie_booking_movie_date_time ON "MovieBooking"(tmdb_movie_id, show_date, show_time);
CREATE INDEX IF NOT EXISTS idx_movie_booking_timeslot_id ON "MovieBooking"(timeslot_id);
ALTER TABLE "MovieBooking" ADD CONSTRAINT unique_movie_slot_seat UNIQUE (tmdb_movie_id, timeslot_id, seat_id);
