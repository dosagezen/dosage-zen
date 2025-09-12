-- Fix the fn_mark_nearest_med_occurrence function to resolve UNION column mismatch and ensure sequential marking
CREATE OR REPLACE FUNCTION public.fn_mark_nearest_med_occurrence(p_med_id uuid, p_action text, p_now timestamp with time zone, p_tz text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_occ medication_occurrences;
  today_local date;
  all_today_done boolean;
  new_status medication_occurrence_status;
BEGIN
  -- Convert current time to user's local date
  today_local := (p_now AT TIME ZONE p_tz)::date;
  
  -- Determine the new status based on action
  CASE p_action
    WHEN 'concluir' THEN new_status := 'concluido';
    WHEN 'cancelar' THEN new_status := 'excluido';
    ELSE RAISE EXCEPTION 'Invalid action: %', p_action;
  END CASE;
  
  -- Find the oldest pending occurrence for this medication (sequential marking)
  SELECT mo.* INTO target_occ
  FROM medication_occurrences mo
  WHERE mo.medication_id = p_med_id
    AND mo.status = 'pendente'
  ORDER BY mo.scheduled_at ASC
  LIMIT 1;
  
  -- If no occurrence found, return error
  IF target_occ.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No pending occurrence found'
    );
  END IF;
  
  -- Mark the occurrence
  UPDATE medication_occurrences 
  SET 
    status = new_status,
    completed_at = now(),
    completed_by = get_user_profile_id(auth.uid()),
    updated_at = now()
  WHERE id = target_occ.id;
  
  -- Check if all today's occurrences are done
  SELECT NOT EXISTS(
    SELECT 1 FROM medication_occurrences mo
    WHERE mo.medication_id = p_med_id
      AND mo.status = 'pendente'
      AND (mo.scheduled_at AT TIME ZONE p_tz)::date = today_local
  ) INTO all_today_done;
  
  -- Return result
  RETURN json_build_object(
    'success', true,
    'occ_id', target_occ.id,
    'scheduled_at', target_occ.scheduled_at,
    'new_status', new_status,
    'all_done_today', all_today_done
  );
END;
$function$;