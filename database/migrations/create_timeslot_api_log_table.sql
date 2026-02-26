-- Ensure no duplicate slots per movie/date/time/screen
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_movie_date_time_screen_unique
ON "Timeslot"(tmdb_movie_id, show_date, start_time, screen_type)
WHERE tmdb_movie_id IS NOT NULL;

-- Track time-slot API activity and outcomes
CREATE TABLE IF NOT EXISTS "TimeSlotApiLog" (
  id BIGSERIAL PRIMARY KEY,
  tmdb_movie_id INTEGER,
  date_from DATE,
  date_to DATE,
  request_payload JSONB,
  response_count INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backward compatibility for existing environments
ALTER TABLE "TimeSlotApiLog"
  DROP COLUMN IF EXISTS endpoint,
  DROP COLUMN IF EXISTS error_message;

-- Ensure one row per tmdb movie id
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tmdb_movie_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM "TimeSlotApiLog"
  WHERE tmdb_movie_id IS NOT NULL
)
DELETE FROM "TimeSlotApiLog" l
USING ranked r
WHERE l.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_api_log_tmdb_movie_id_unique
ON "TimeSlotApiLog"(tmdb_movie_id)
WHERE tmdb_movie_id IS NOT NULL;
