-- Function to get permillili results for a specific season and group
CREATE OR REPLACE FUNCTION get_permillili_results(p_season TEXT, p_group TEXT)
RETURNS TABLE (
    meetsid BIGINT,
    meetname TEXT,
    mindate TEXT,
    fincode BIGINT,
    name TEXT,
    gender TEXT,
    seasondescription TEXT,
    groups TEXT,
    cat TEXT,
    stylesid INT,
    limit_dist INT,
    limit_descr_short TEXT,
    result_string TEXT,
    limit_string TEXT,
    permillili INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        meets_teammanager.meetsid,
        meets_teammanager.meetname,
        meets_teammanager.mindate,
        athletes.fincode,
        athletes.name,
        athletes.gender,
        rosters.seasondescription,
        rosters.groups,
        rosters.cat,
        results_teammanager.stylesid,
        COALESCE(_limits.limit_dist, 
                (SELECT _races.distance FROM _races WHERE _races.raceid = results_teammanager.stylesid)):: INT AS limit_dist,
        COALESCE(_limits.limit_descr_short, 
                 (SELECT _races.stroke_shortname FROM _races WHERE _races.raceid = results_teammanager.stylesid)) AS limit_descr_short,
        -- campo calcolato mm:ss.cc
        format_time_decimal(results_teammanager.totaltime) AS result_string,
        format_time_decimal(_limits.limit_time_decimal) AS limit_string,
        ((_limits.limit_time_decimal::numeric / results_teammanager.totaltime) * 1000)::int AS permillili
    FROM
        (
            (
                athletes
                INNER JOIN rosters ON athletes.fincode = rosters.fincode
            )
            INNER JOIN (
                meets_teammanager
                INNER JOIN results_teammanager ON meets_teammanager.meetsid = results_teammanager.meetsid
            ) ON athletes.fincode = results_teammanager.fincode
        )
        LEFT JOIN _limits ON (
            results_teammanager.stylesid = _limits.limit_styleid
            AND rosters.seasondescription = _limits.limit_season
            AND meets_teammanager.course = _limits.limit_course
            AND athletes.gender = _limits.limit_gender
            AND rosters.cat = _limits.limit_cat
        )
    WHERE
        rosters.seasondescription = p_season
        AND rosters.groups = p_group
        AND meets_teammanager.mindate >= (
            -- Extract start year from season (e.g., '2025-26' -> 2025)
            CASE 
                WHEN p_season ~ '^\d{4}-\d{2}$' THEN
                    SUBSTRING(p_season FROM 1 FOR 4) || '-09-01'
                ELSE
                    '1900-01-01'
            END
        )
        AND meets_teammanager.mindate <= (
            -- Extract end year from season (e.g., '2025-26' -> 2026)
            CASE 
                WHEN p_season ~ '^\d{4}-\d{2}$' THEN
                    (SUBSTRING(p_season FROM 1 FOR 4)::INT + 1)::TEXT ||
                    '-08-31'
                ELSE
                    '2100-12-31'
            END
        )
    ORDER BY
        athletes.name;
END;
$$ LANGUAGE plpgsql;
