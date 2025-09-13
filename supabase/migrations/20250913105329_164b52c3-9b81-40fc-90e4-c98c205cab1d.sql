-- Create medication check log table for pontuality analysis
CREATE TABLE public.medication_check_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  med_id UUID NOT NULL,
  occ_id UUID NOT NULL,
  user_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action TEXT NOT NULL CHECK (action IN ('concluir', 'cancelar')),
  delta_minutes INTEGER NOT NULL, -- checked_at - scheduled_at in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on medication_check_log
ALTER TABLE public.medication_check_log ENABLE ROW LEVEL SECURITY;

-- Create policies for medication_check_log
CREATE POLICY "Users can insert their medication check logs" 
ON public.medication_check_log 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.collaborations c
    JOIN public.profiles p ON c.patient_profile_id = p.id
    JOIN public.medications m ON m.patient_profile_id = p.id
    WHERE m.id = med_id
      AND c.collaborator_profile_id = get_user_profile_id(auth.uid())
      AND c.is_active = true
      AND c.collaborator_role IN ('acompanhante', 'gestor')
  )
);

CREATE POLICY "Users can view their medication check logs" 
ON public.medication_check_log 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.collaborations c
    JOIN public.profiles p ON c.patient_profile_id = p.id
    JOIN public.medications m ON m.patient_profile_id = p.id
    WHERE m.id = med_id
      AND c.collaborator_profile_id = get_user_profile_id(auth.uid())
      AND c.is_active = true
  )
);

-- Create performance indices
CREATE INDEX idx_medication_occurrences_med_scheduled_status 
ON public.medication_occurrences (medication_id, scheduled_at, status);

CREATE INDEX idx_medication_check_log_med_id_created 
ON public.medication_check_log (med_id, created_at DESC);

-- Function to generate day schedule without side effects
CREATE OR REPLACE FUNCTION public.fn_generate_day_schedule(
  p_med_id UUID,
  p_day_local DATE,
  p_tz TEXT
) RETURNS TABLE(horario TIME)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  med_record medications;
  start_time TIME;
  freq_value INT;
  interval_hours DECIMAL;
  current_time TIME;
  day_start_utc TIMESTAMP WITH TIME ZONE;
  day_end_utc TIMESTAMP WITH TIME ZONE;
  first_occurrence_utc TIMESTAMP WITH TIME ZONE;
  occurrence_utc TIMESTAMP WITH TIME ZONE;
  occurrence_local TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get medication details
  SELECT * INTO med_record 
  FROM medications 
  WHERE id = p_med_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check if medication is active on this day
  IF med_record.data_inicio IS NOT NULL AND p_day_local < med_record.data_inicio THEN
    RETURN;
  END IF;
  
  IF med_record.data_fim IS NOT NULL AND p_day_local > med_record.data_fim THEN
    RETURN;
  END IF;
  
  -- Parse frequency - assume format like "2x/dia" or "8h"
  IF med_record.frequencia ~ '^\d+x/dia$' THEN
    freq_value := substring(med_record.frequencia from '(\d+)')::INT;
    interval_hours := 24.0 / freq_value;
  ELSIF med_record.frequencia ~ '^\d+h$' THEN
    interval_hours := substring(med_record.frequencia from '(\d+)')::DECIMAL;
  ELSE
    -- Default fallback
    freq_value := 1;
    interval_hours := 24.0;
  END IF;
  
  -- Get start time from horarios array (first element) or default to 08:00
  IF array_length(med_record.horarios, 1) > 0 THEN
    start_time := (med_record.horarios[1])::TIME;
  ELSE
    start_time := '08:00'::TIME;
  END IF;
  
  -- Calculate day boundaries in UTC
  day_start_utc := (p_day_local::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE p_tz;
  day_end_utc := (p_day_local::TEXT || ' 23:59:59')::TIMESTAMP AT TIME ZONE p_tz;
  
  -- Find first occurrence of the day
  first_occurrence_utc := (p_day_local::TEXT || ' ' || start_time::TEXT)::TIMESTAMP AT TIME ZONE p_tz;
  
  -- If this is the start day and first occurrence is before start time, adjust
  IF med_record.data_inicio IS NOT NULL AND p_day_local = med_record.data_inicio THEN
    first_occurrence_utc := GREATEST(first_occurrence_utc, day_start_utc);
  END IF;
  
  -- Generate occurrences for the day
  occurrence_utc := first_occurrence_utc;
  
  WHILE occurrence_utc <= day_end_utc LOOP
    -- Convert back to local time and extract time part
    occurrence_local := occurrence_utc AT TIME ZONE p_tz;
    current_time := occurrence_local::TIME;
    
    -- Round to 15-minute blocks for fractional hours
    IF interval_hours != FLOOR(interval_hours) THEN
      current_time := (
        EXTRACT(hour FROM current_time) || ':' ||
        CASE 
          WHEN EXTRACT(minute FROM current_time) < 7.5 THEN '00'
          WHEN EXTRACT(minute FROM current_time) < 22.5 THEN '15'
          WHEN EXTRACT(minute FROM current_time) < 37.5 THEN '30'
          WHEN EXTRACT(minute FROM current_time) < 52.5 THEN '45'
          ELSE '00'
        END
      )::TIME;
      
      -- Handle hour overflow from rounding
      IF EXTRACT(minute FROM current_time) = 0 AND EXTRACT(minute FROM occurrence_local::TIME) > 52.5 THEN
        current_time := current_time + interval '1 hour';
      END IF;
    END IF;
    
    RETURN NEXT current_time;
    
    -- Next occurrence
    occurrence_utc := occurrence_utc + (interval_hours || ' hours')::INTERVAL;
  END LOOP;
  
  RETURN;
END;
$$;

-- Enhanced function to mark nearest occurrence with logging
CREATE OR REPLACE FUNCTION public.fn_mark_nearest_med_occurrence(
  p_med_id UUID,
  p_action TEXT,
  p_now_utc TIMESTAMP WITH TIME ZONE,
  p_tz TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_occ medication_occurrences;
  today_local DATE;
  now_local TIMESTAMP WITH TIME ZONE;
  all_today_done BOOLEAN;
  new_status medication_occurrence_status;
  delta_mins INTEGER;
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Determine user's local date and time
  today_local := (p_now_utc AT TIME ZONE p_tz)::DATE;
  now_local := p_now_utc AT TIME ZONE p_tz;

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
    completed_by = get_user_profile_id(current_user_id),
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

-- Function to restore all today's occurrences for a medication
CREATE OR REPLACE FUNCTION public.fn_restore_card_for_today(
  p_med_id UUID,
  p_day_local DATE,
  p_tz TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restored_count INTEGER;
BEGIN
  -- Update all today's non-pending occurrences back to pending
  UPDATE medication_occurrences
  SET 
    status = 'pendente',
    completed_at = NULL,
    completed_by = NULL,
    updated_at = now()
  WHERE medication_id = p_med_id
    AND (scheduled_at AT TIME ZONE p_tz)::DATE = p_day_local
    AND status != 'pendente';
  
  GET DIAGNOSTICS restored_count = ROW_COUNT;
  
  RETURN restored_count;
END;
$$;

-- Function to undo last occurrence mark
CREATE OR REPLACE FUNCTION public.fn_undo_last_occurrence(
  p_occ_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_occ medication_occurrences;
BEGIN
  -- Get the occurrence
  SELECT * INTO target_occ
  FROM medication_occurrences
  WHERE id = p_occ_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Occurrence not found');
  END IF;
  
  -- Restore to pending status
  UPDATE medication_occurrences
  SET
    status = 'pendente',
    completed_at = NULL,
    completed_by = NULL,
    updated_at = now()
  WHERE id = p_occ_id;
  
  RETURN json_build_object(
    'success', true,
    'occ_id', p_occ_id,
    'restored_status', 'pendente'
  );
END;
$$;