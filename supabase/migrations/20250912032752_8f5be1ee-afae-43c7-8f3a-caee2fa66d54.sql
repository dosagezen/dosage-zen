-- Create a function to count medications by type for a user
CREATE OR REPLACE FUNCTION public.fn_count_medications(p_patient_profile_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  hoje_count INT;
  ativas_count INT;
  todas_count INT;
  today_date DATE;
BEGIN
  today_date := CURRENT_DATE;
  
  -- Count medications with pending occurrences today
  SELECT COUNT(DISTINCT m.id) INTO hoje_count
  FROM medications m
  LEFT JOIN medication_occurrences mo ON (
    m.id = mo.medication_id 
    AND mo.scheduled_at::date = today_date 
    AND mo.status = 'pendente'
  )
  WHERE m.patient_profile_id = p_patient_profile_id
    AND m.ativo = true
    AND (
      mo.id IS NOT NULL -- Has pending occurrences today
      OR (
        -- Or should have doses today based on schedule
        (m.data_inicio IS NULL OR m.data_inicio <= today_date)
        AND (m.data_fim IS NULL OR m.data_fim >= today_date)
        AND array_length(m.horarios, 1) > 0
      )
    );
  
  -- Count active medications
  SELECT COUNT(*) INTO ativas_count
  FROM medications m
  WHERE m.patient_profile_id = p_patient_profile_id
    AND m.ativo = true;
  
  -- Count all medications
  SELECT COUNT(*) INTO todas_count
  FROM medications m
  WHERE m.patient_profile_id = p_patient_profile_id;
  
  RETURN json_build_object(
    'hoje', hoje_count,
    'ativas', ativas_count,
    'todas', todas_count
  );
END;
$$;