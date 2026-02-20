-- Keep only latest log row per tmdb_movie_id
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

-- Enforce uniqueness for tmdb_movie_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_api_log_tmdb_movie_id_unique
ON "TimeSlotApiLog"(tmdb_movie_id)
WHERE tmdb_movie_id IS NOT NULL;
