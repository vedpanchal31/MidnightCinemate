-- Test User table column names to verify the fix
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'User' 
    AND column_name IN ('createdAt', 'updatedAt', 'created_at', 'updated_at')
ORDER BY column_name;
