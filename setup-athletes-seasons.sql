-- SQL setup for Athletes with Season functionality
-- Run this in your Supabase SQL Editor

-- 1. Create the _seasons table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS _seasons (
    id BIGSERIAL PRIMARY KEY,
    season_name VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert sample seasons data (adjust dates as needed)
INSERT INTO _seasons (season_name, start_date, end_date) VALUES
('2023/2024', '2023-09-01', '2024-08-31'),
('2024/2025', '2024-09-01', '2025-08-31'),
('2025/2026', '2025-09-01', '2026-08-31')
ON CONFLICT (season_name) DO NOTHING;

-- 3. Create or replace the get_athletes_with_rosters function
CREATE OR REPLACE FUNCTION get_athletes_with_rosters(paramseason TEXT)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    photo TEXT,
    groups TEXT, -- Adjust this type based on your actual groups column
    -- Add other athlete fields you need here
    birthdate DATE,
    email TEXT,
    phone TEXT
) AS $$
BEGIN
    -- This is a basic implementation. You'll need to adjust it based on your actual schema
    -- The function should join athletes with any roster/enrollment table for the given season
    
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.photo,
        a.groups,
        a.birthdate,
        a.email,
        a.phone
    FROM athletes a
    -- Add JOIN with roster/enrollment table here when available
    -- Example: JOIN athlete_rosters ar ON a.id = ar.athlete_id
    -- JOIN _seasons s ON s.season_name = paramseason
    -- WHERE ar.season = paramseason
    WHERE TRUE; -- Temporarily return all athletes - replace with proper season filtering
END;
$$ LANGUAGE plpgsql;

-- 4. Grant permissions for anonymous access (matching your current setup)
GRANT SELECT ON _seasons TO anon;
GRANT SELECT ON _seasons TO authenticated;
GRANT EXECUTE ON FUNCTION get_athletes_with_rosters(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_athletes_with_rosters(TEXT) TO authenticated;

-- 5. Disable RLS on _seasons table to match your current setup
ALTER TABLE _seasons DISABLE ROW LEVEL SECURITY;
