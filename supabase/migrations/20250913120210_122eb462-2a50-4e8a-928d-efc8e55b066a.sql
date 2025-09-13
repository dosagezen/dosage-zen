-- Fix RLS policies and RPC function for medication check system

-- Drop existing problematic function
DROP FUNCTION IF EXISTS public.fn_mark_nearest_med_occurrence(uuid, text, timestamp with time zone, text);

-- Create improved function with SECURITY DEFINER
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
AS $$
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
  
  -- Get user profile ID
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

  -- Strategy (a): Today, from now onwards (pending occurrences >= current time)
  SELECT mo.* INTO target_occ
  FROM medication_occurrences mo
  WHERE mo.medication_id = p_med_id
    AND mo.status = 'pendente'
    AND (mo.scheduled_at AT TIME ZONE p_tz)::DATE = today_local
    AND (mo.scheduled_at AT TIME ZONE p_tz) >= now_local
  ORDER BY mo.scheduled_at ASC
  LIMIT 1;

  -- Strategy (b): Future days (if no pending today from now onwards)
  IF NOT FOUND THEN
    SELECT mo.* INTO target_occ
    FROM medication_occurrences mo
    WHERE mo.medication_id = p_med_id
      AND mo.status = 'pendente'
      AND (mo.scheduled_at AT TIME ZONE p_tz)::DATE > today_local
    ORDER BY mo.scheduled_at ASC
    LIMIT 1;
  END IF;

  -- Strategy (c): Fallback - today, before current time (most recent pending)
  IF NOT FOUND THEN
    SELECT mo.* INTO target_occ
    FROM medication_occurrences mo
    WHERE mo.medication_id = p_med_id
      AND mo.status = 'pendente'
      AND (mo.scheduled_at AT TIME ZONE p_tz)::DATE = today_local
      AND (mo.scheduled_at AT TIME ZONE p_tz) < now_local
    ORDER BY mo.scheduled_at DESC
    LIMIT 1;
  END IF;

  IF target_occ.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'No pending occurrence found');
  END IF;

  -- Calculate delta in minutes
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

  -- Check if all today's occurrences are done
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
$$;

-- Update RLS policy for medication_occurrences to allow SECURITY DEFINER functions
DROP POLICY IF EXISTS "Patients can update medication occurrence status" ON medication_occurrences;

CREATE POLICY "Patients can update medication occurrence status" 
ON medication_occurrences 
FOR UPDATE 
USING (
  -- Allow if user owns the patient profile directly
  patient_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
  OR
  -- Allow if user is a collaborator with permission
  patient_profile_id IN (
    SELECT c.patient_profile_id
    FROM collaborations c
    JOIN profiles p ON c.collaborator_profile_id = p.id
    WHERE p.user_id = auth.uid()
      AND c.is_active = true
      AND c.collaborator_role IN ('acompanhante', 'gestor')
  )
);

-- Create policy to allow SECURITY DEFINER functions to update
CREATE POLICY "Security definer functions can update occurrences"
ON medication_occurrences
FOR UPDATE
TO service_role
USING (true);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION fn_mark_nearest_med_occurrence TO authenticated;
GRANT EXECUTE ON FUNCTION fn_mark_nearest_med_occurrence TO service_role;