-- Debug the timeslot date validation issue
SELECT 
    id,
    tmdb_movie_id,
    show_date,
    to_char(show_date, 'YYYY-MM-DD') AS slot_show_date,
    start_time,
    to_char(start_time, 'HH24:MI') AS slot_show_time,
    is_active
FROM "Timeslot" 
WHERE id = '6d87787b-d78c-4a05-96f5-76e3debe5591';
