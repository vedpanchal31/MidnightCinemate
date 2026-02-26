-- Find timeslots for this movie on February 27, 2026
SELECT 
    id,
    tmdb_movie_id,
    show_date,
    to_char(show_date, 'YYYY-MM-DD') AS slot_show_date,
    start_time,
    to_char(start_time, 'HH24:MI') AS slot_show_time,
    screen_type,
    available_seats
FROM "Timeslot" 
WHERE tmdb_movie_id = 1407523 
    AND show_date = '2026-02-27'
    AND is_active = true
ORDER BY start_time;
