-- Updated function to handle "All Groups" case
CREATE OR REPLACE FUNCTION get_athletes_with_rosters(paramSeason TEXT, paramGroups TEXT)
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
        AND
        (paramGroups IS NULL OR r.groups = paramGroups);
END;
$$ LANGUAGE plpgsql;
