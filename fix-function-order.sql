-- Option 1: Update the function to match Supabase's expected parameter order
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_athletes_with_rosters(paramGroups TEXT, paramSeason TEXT)
RETURNS TABLE (
    -- Campi della tabella athletes
    fincode BIGINT,
    name TEXT,
    birthdate TEXT,
    gender TEXT,
    email TEXT,
    phone TEXT,
    active boolean,
    photo TEXT,
    athleteid BIGINT,
    -- Campo della tabella rosters
    groups TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.fincode,
        a.name,
        a.birthdate,
        a.gender,
        a.email,
        a.phone,
        a.active,
        a.photo,
        a.athleteid,
        r.groups AS groups
    FROM 
        athletes a
    JOIN 
        rosters r ON a.fincode = r.fincode
    WHERE 
        r.seasondescription = paramSeason
        and
        r.groups = paramGroups;
END;
$$ LANGUAGE plpgsql;
