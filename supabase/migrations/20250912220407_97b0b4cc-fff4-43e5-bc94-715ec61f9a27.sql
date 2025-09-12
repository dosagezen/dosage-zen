-- Update the fn_mark_nearest_med_occurrence function to properly handle the "current time" logic
CREATE OR REPLACE FUNCTION public.fn_mark_nearest_med_occurrence(
  p_med_id uuid,
  p_action text,
  p_now timestamp with time zone,
  p_tz text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_occ medication_occurrences;
  today_local date;
  now_local timestamp with time zone;
  all_today_done boolean;
  new_status medication_occurrence_status;
BEGIN
  -- Determine user's local date and time
  today_local := (p_now AT TIME ZONE p_tz)::date;
  now_local := p_now AT TIME ZONE p_tz;

  -- Map action to status
  CASE p_action
    WHEN 'concluir' THEN new_status := 'concluido';
    WHEN 'cancelar' THEN new_status := 'excluido';
    ELSE RAISE EXCEPTION 'Invalid action: %', p_action;
  END CASE;

  -- Strategy (a): Today, from now onwards (pending occurrences >= current time)
  SELECT mo.* INTO target_occ
  FROM medication_occurrences mo
  WHERE mo.medication_id = p_med_id
    AND mo.status = 'pendente'
    AND (mo.scheduled_at AT TIME ZONE p_tz)::date = today_local
    AND (mo.scheduled_at AT TIME ZONE p_tz) >= now_local
  ORDER BY mo.scheduled_at ASC
  LIMIT 1;

  -- Strategy (b): Future days (if no pending today from now onwards)
  IF NOT FOUND THEN
    SELECT mo.* INTO target_occ
    FROM medication_occurrences mo
    WHERE mo.medication_id = p_med_id
      AND mo.status = 'pendente'
      AND (mo.scheduled_at AT TIME ZONE p_tz)::date > today_local
    ORDER BY mo.scheduled_at ASC
    LIMIT 1;
  END IF;

  -- Strategy (c): Fallback - today, before current time (most recent pending)
  IF NOT FOUND THEN
    SELECT mo.* INTO target_occ
    FROM medication_occurrences mo
    WHERE mo.medication_id = p_med_id
      AND mo.status = 'pendente'
      AND (mo.scheduled_at AT TIME ZONE p_tz)::date = today_local
      AND (mo.scheduled_at AT TIME ZONE p_tz) < now_local
    ORDER BY mo.scheduled_at DESC
    LIMIT 1;
  END IF;

  IF target_occ.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'No pending occurrence found');
  END IF;

  -- Update the target occurrence
  UPDATE medication_occurrences
  SET
    status = new_status,
    completed_at = now(),
    completed_by = get_user_profile_id(auth.uid()),
    updated_at = now()
  WHERE id = target_occ.id;

  -- Check if all today's occurrences are done (relative to user's timezone)
  SELECT NOT EXISTS(
    SELECT 1
    FROM medication_occurrences mo
    WHERE mo.medication_id = p_med_id
      AND mo.status = 'pendente'
      AND (mo.scheduled_at AT TIME ZONE p_tz)::date = today_local
  ) INTO all_today_done;

  RETURN json_build_object(
    'success', true,
    'occ_id', target_occ.id,
    'scheduled_at', target_occ.scheduled_at,
    'new_status', new_status,
    'all_done_today', all_today_done
  );
END;
$function$;