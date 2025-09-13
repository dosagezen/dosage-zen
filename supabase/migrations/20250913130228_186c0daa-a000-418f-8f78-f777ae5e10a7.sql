-- Replace fn_upsert_medication_occurrences to be timezone-aware
CREATE OR REPLACE FUNCTION public.fn_upsert_medication_occurrences(
  p_medication_id uuid,
  p_patient_profile_id uuid,
  p_horarios text[],
  p_data_inicio date,
  p_data_fim date,
  p_tz text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  end_date date;
  today_date date;
BEGIN
  -- Determine "today" based on user's timezone
  today_date := (now() AT TIME ZONE p_tz)::date;

  -- Limit generation to D+7 max to prevent performance issues
  end_date := LEAST(
    COALESCE(p_data_fim, today_date + interval '7 days'), 
    today_date + interval '7 days'
  );
  
  -- Only process if start date is not too far in the future
  IF COALESCE(p_data_inicio, today_date) > today_date + interval '7 days' THEN
    RETURN;
  END IF;
  
  -- Delete existing occurrences from today (local) onwards
  DELETE FROM medication_occurrences 
  WHERE medication_id = p_medication_id 
    AND (scheduled_at AT TIME ZONE p_tz)::date >= today_date;
  
  -- Insert new occurrences for local days/times converted to UTC
  INSERT INTO medication_occurrences (medication_id, patient_profile_id, scheduled_at)
  SELECT 
    p_medication_id,
    p_patient_profile_id,
    -- Interpret local timestamp in p_tz and store as timestamptz (UTC)
    ( (today_date + (day_offset || ' days')::interval + horario::time) AT TIME ZONE p_tz )
  FROM 
    generate_series(0, end_date - today_date) AS day_offset,
    unnest(p_horarios) AS horario
  WHERE 
    (today_date + (day_offset || ' days')::interval) >= COALESCE(p_data_inicio, today_date)
    AND (today_date + (day_offset || ' days')::interval) <= end_date
    AND array_length(p_horarios, 1) > 0;
  
  -- Log the generation for debugging
  RAISE LOG 'Generated occurrences (tz=%) for med_id: %, horarios: %, days: % to %', 
    p_tz, p_medication_id, array_length(p_horarios, 1), today_date, end_date;
END;
$function$;