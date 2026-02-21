ALTER TABLE "MovieBooking"
DROP CONSTRAINT IF EXISTS unique_movie_slot_seat;

ALTER TABLE "MovieBooking"
ALTER COLUMN seat_id DROP NOT NULL;

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

CREATE INDEX IF NOT EXISTS idx_booking_seat_booking_id
ON "BookingSeat"(booking_id);

INSERT INTO "BookingSeat"(booking_id, tmdb_movie_id, timeslot_id, seat_id, status, created_at, updated_at)
SELECT
  mb.id,
  mb.tmdb_movie_id,
  mb.timeslot_id,
  mb.seat_id,
  CASE
    WHEN mb.status::text ~ '^[0-9]+$' THEN mb.status::int
    WHEN LOWER(mb.status::text) = 'pending_payment' THEN 1
    WHEN LOWER(mb.status::text) = 'confirmed' THEN 2
    WHEN LOWER(mb.status::text) = 'failed' THEN 3
    WHEN LOWER(mb.status::text) = 'expired' THEN 4
    WHEN LOWER(mb.status::text) = 'cancelled' THEN 5
    WHEN LOWER(mb.status::text) = 'refunded' THEN 6
    ELSE 5
  END,
  mb.created_at,
  mb.updated_at
FROM "MovieBooking" mb
LEFT JOIN "BookingSeat" bs
  ON bs.booking_id = mb.id AND bs.seat_id = mb.seat_id
WHERE mb.seat_id IS NOT NULL
  AND bs.id IS NULL;

DROP INDEX IF EXISTS idx_movie_booking_active_seat_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_seat_active_unique
ON "BookingSeat"(tmdb_movie_id, timeslot_id, seat_id)
WHERE status IN (1, 2);
