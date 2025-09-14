-- Fix selection order to mark the earliest pending occurrence of today first
CREATE OR REPLACE FUNCTION public.fn_mark_nearest_med_occurrence(
  p_med_id uuid,
  p_action text,
  p_now_utc timestamp with time zone,
  p_tz text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_occ medication_occurrences;
  today_local DATE;
  now_local TIMESTAMP WITH TIME ZONE;
  all_today_done BOOLEAN;
  new_status medication_occurrence_status;
  delta_mins INTEGER;
  current_user_id UUID;
  user_profile_id UUID;
BEGIN
  -- Get current user and their profile
  current_user_id := auth.uid();

  SELECT id INTO user_profile_id 
  FROM profiles 
  WHERE user_id = current_user_id;

  IF user_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User profile not found');
  END IF;

  -- Determine user's local date and time
  today_local := (p_now_utc AT TIME ZONE p_tz)::DATE;
  now_local := p_now_utc AT TIME ZONE p_tz;

  -- Map action to status
  CASE p_action
    WHEN 'concluir' THEN new_status := 'concluido';
    WHEN 'cancelar' THEN new_status := 'excluido';
    ELSE RETURN json_build_object('success', false, 'message', 'Invalid action: ' || p_action);
  END CASE;

  -- NEW STRATEGY: Always prioritize the earliest pending occurrence of TODAY (local)
  SELECT mo.* INTO target_occ
  FROM medication_occurrences mo
  WHERE mo.medication_id = p_med_id
    AND mo.status = 'pendente'
    AND (mo.scheduled_at AT TIME ZONE p_tz)::DATE = today_local
  ORDER BY (mo.scheduled_at AT TIME ZONE p_tz) ASC
  LIMIT 1;

  -- If no pending today, pick the earliest pending in FUTURE days
  IF NOT FOUND THEN
    SELECT mo.* INTO target_occ
    FROM medication_occurrences mo
    WHERE mo.medication_id = p_med_id
      AND mo.status = 'pendente'
      AND (mo.scheduled_at AT TIME ZONE p_tz)::DATE > today_local
    ORDER BY mo.scheduled_at ASC
    LIMIT 1;
  END IF;

  IF target_occ.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'No pending occurrence found');
  END IF;

  -- Calculate delta in minutes (current time vs. scheduled time)
  delta_mins := EXTRACT(EPOCH FROM (p_now_utc - target_occ.scheduled_at)) / 60;

  -- Update the target occurrence
  UPDATE medication_occurrences
  SET
    status = new_status,
    completed_at = p_now_utc,
    completed_by = user_profile_id,
    updated_at = p_now_utc
  WHERE id = target_occ.id;

  -- Log the check
  INSERT INTO medication_check_log (
    med_id, occ_id, user_id, scheduled_at, checked_at, action, delta_minutes
  ) VALUES (
    p_med_id, target_occ.id, current_user_id, target_occ.scheduled_at, p_now_utc, p_action, delta_mins
  );

  -- Check if all today's occurrences are done (no pending left for today)
  SELECT NOT EXISTS(
    SELECT 1
    FROM medication_occurrences mo
    WHERE mo.medication_id = p_med_id
      AND mo.status = 'pendente'
      AND (mo.scheduled_at AT TIME ZONE p_tz)::DATE = today_local
  ) INTO all_today_done;

  RETURN json_build_object(
    'success', true,
    'occ_id', target_occ.id,
    'scheduled_at', target_occ.scheduled_at,
    'new_status', new_status,
    'all_done_today', all_today_done,
    'delta_minutes', delta_mins
  );
END;
$function$;