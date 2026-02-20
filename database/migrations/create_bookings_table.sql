-- Create MovieBooking table
CREATE TABLE IF NOT EXISTS "MovieBooking" (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  tmdb_movie_id INTEGER NOT NULL,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  seat_id VARCHAR(10),
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  timeslot_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BookingSeat" (
  id BIGSERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES "MovieBooking"(id) ON DELETE CASCADE,
  tmdb_movie_id INTEGER NOT NULL,
  timeslot_id UUID NOT NULL,
  seat_id VARCHAR(10) NOT NULL,
  status INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes and Constraints
CREATE INDEX IF NOT EXISTS idx_movie_booking_movie_date_time ON "MovieBooking"(tmdb_movie_id, show_date, show_time);
CREATE INDEX IF NOT EXISTS idx_movie_booking_timeslot_id ON "MovieBooking"(timeslot_id);
CREATE INDEX IF NOT EXISTS idx_booking_seat_booking_id ON "BookingSeat"(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_seat_active_unique
ON "BookingSeat"(tmdb_movie_id, timeslot_id, seat_id)
WHERE status IN (1, 2);
