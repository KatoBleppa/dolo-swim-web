CREATE OR REPLACE FUNCTION fn_miglioramenti_tempi_estesa(
  course_param integer,
  group_param text,
  season_param text
)
RETURNS TABLE (
  membersid integer,
  name text,
  selgroup text,
  stylesid integer,
  distance integer,
  stroke_shortname text,
  course integer,
  eventdate_prima text,
  totaltime_prima numeric(10,3),
  tempo_prima text,
  eventdate_dopo text,
  totaltime_dopo numeric(10,3),
  tempo_dopo text,
  delta_sec numeric(8,2),
  miglioramento_perc numeric(8,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  season_start_year integer;
  season_end_year integer;
  previous_season text;
  before_date text;
  after_date text;
BEGIN
  -- Parse season parameter and calculate dates as text
  season_start_year := CAST(split_part(season_param, '-', 1) AS integer);
  season_end_year := CAST(split_part(season_param, '-', 2) AS integer);
  
  -- Calculate previous season
  previous_season := (season_start_year - 1)::text || '-' || season_start_year::text;
  
  -- Date range for current season (Sept 1 of start year to Aug 31 of end year)
  before_date := season_start_year::text || '-09-01';
  after_date := (2000 + season_end_year)::text || '-09-01';
  
  RETURN QUERY
  WITH best_times_before AS (
    SELECT 
      rt.membersid::integer AS membersid,
      rt.stylesid,
      rt.course,
      MIN(rt.totaltime)::numeric(10,3) AS best_time,
      r.distance::integer AS distance,
      r.stroke_shortname
    FROM results_teammanager rt
    JOIN _races r ON rt.stylesid = r.raceid
    JOIN athletes a ON rt.membersid = a.athleteid
    JOIN rosters ro ON a.fincode = ro.fincode AND ro.seasondescription = previous_season
    WHERE rt.course = course_param 
      AND rt.eventdate < before_date
      AND ro.groups = group_param
    GROUP BY rt.membersid, rt.stylesid, rt.course, r.distance, r.stroke_shortname
  ),
  best_times_after AS (
    SELECT 
      rt.membersid::integer AS membersid,
      rt.stylesid,
      MIN(rt.totaltime)::numeric(10,3) AS best_time
    FROM results_teammanager rt
    JOIN athletes a ON rt.membersid = a.athleteid
    JOIN rosters ro ON a.fincode = ro.fincode AND ro.seasondescription = season_param
    WHERE rt.course = course_param 
      AND rt.eventdate >= before_date
      AND rt.eventdate < after_date
      AND ro.groups = group_param
    GROUP BY rt.membersid, rt.stylesid
  ),
  improvements AS (
    SELECT 
      btb.membersid,
      a.name,
      ro.groups AS selgroup,
      btb.stylesid,
      btb.distance,
      btb.stroke_shortname,
      btb.course,
      rt_before.eventdate AS eventdate_prima,
      btb.best_time AS totaltime_prima,
      format_time_decimal(btb.best_time) AS tempo_prima,
      rt_after.eventdate AS eventdate_dopo,
      bta.best_time AS totaltime_dopo,
      format_time_decimal(bta.best_time) AS tempo_dopo,
      ROUND((bta.best_time - btb.best_time) / 1000.0, 2)::numeric(8,2) AS delta_sec,
      ROUND(((btb.best_time - bta.best_time) * 100.0) / btb.best_time, 2)::numeric(8,2) AS miglioramento_perc
    FROM best_times_before btb
    JOIN best_times_after bta ON btb.membersid = bta.membersid AND btb.stylesid = bta.stylesid
    JOIN athletes a ON btb.membersid = a.athleteid
    JOIN rosters ro ON a.fincode = ro.fincode AND ro.seasondescription = season_param
    -- Get the actual event dates for the best times
    JOIN results_teammanager rt_before ON btb.membersid = rt_before.membersid 
      AND btb.stylesid = rt_before.stylesid 
      AND btb.best_time = rt_before.totaltime
      AND rt_before.eventdate < before_date
    JOIN results_teammanager rt_after ON bta.membersid = rt_after.membersid 
      AND bta.stylesid = rt_after.stylesid 
      AND bta.best_time = rt_after.totaltime
      AND rt_after.eventdate >= before_date
      AND rt_after.eventdate < after_date
  )
  SELECT 
    i.membersid,
    i.name,
    i.selgroup,
    i.stylesid,
    i.distance,
    i.stroke_shortname,
    i.course,
    i.eventdate_prima,
    i.totaltime_prima,
    i.tempo_prima,
    i.eventdate_dopo,
    i.totaltime_dopo,
    i.tempo_dopo,
    i.delta_sec,
    i.miglioramento_perc
  FROM improvements i
  ORDER BY i.name, i.miglioramento_perc DESC;
END;
$$;
