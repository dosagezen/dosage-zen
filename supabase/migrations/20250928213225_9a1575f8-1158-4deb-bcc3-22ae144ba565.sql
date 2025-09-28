-- Create unified view for conquests occurrences (without RLS on view)
CREATE OR REPLACE VIEW public.v_conquests_occurrences AS
SELECT 
  mo.patient_profile_id as context_id,
  'medication' as source,
  'medicacao' as category,
  mo.scheduled_at as due_at,
  mo.status::text,
  mo.completed_at,
  mo.completed_by,
  mo.id as occurrence_id
FROM public.medication_occurrences mo
WHERE mo.patient_profile_id IS NOT NULL

UNION ALL

SELECT 
  a.patient_profile_id as context_id,
  'agenda' as source,
  a.tipo as category,
  a.data_agendamento as due_at,
  a.status::text,
  CASE 
    WHEN a.status = 'realizado' THEN a.updated_at
    WHEN a.status = 'cancelado' THEN a.updated_at
    ELSE NULL 
  END as completed_at,
  NULL as completed_by,
  a.id as occurrence_id
FROM public.appointments a
WHERE a.patient_profile_id IS NOT NULL;

-- Create function to calculate conquests summary
CREATE OR REPLACE FUNCTION public.fn_conquests_summary(
  p_context_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz,
  p_tz text DEFAULT 'UTC'
) RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_planejados integer := 0;
  total_concluidos integer := 0;
  total_faltando integer := 0;
  total_atrasados integer := 0;
  total_cancelados integer := 0;
  by_category jsonb := '{}';
  cat_record record;
  current_utc timestamptz := now();
  user_profile_id uuid;
BEGIN
  -- Get user profile ID for RLS check
  SELECT get_user_profile_id(auth.uid()) INTO user_profile_id;
  
  -- Verify access to this context
  IF NOT (
    p_context_id = user_profile_id OR
    EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.patient_profile_id = p_context_id
        AND c.collaborator_profile_id = user_profile_id
        AND c.is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to context %', p_context_id;
  END IF;
  
  -- Calculate totals by category
  FOR cat_record IN 
    SELECT 
      category,
      COUNT(*) as planejados,
      COUNT(CASE 
        WHEN status = 'excluido' OR status = 'cancelado' THEN 1 
        ELSE NULL 
      END) as cancelados,
      COUNT(CASE 
        WHEN (status = 'concluido' OR status = 'realizado') 
          AND completed_at IS NOT NULL 
          AND ABS(EXTRACT(EPOCH FROM (completed_at - due_at))) <= 15 * 60 
        THEN 1 
        ELSE NULL 
      END) as concluidos,
      COUNT(CASE 
        WHEN ((status = 'concluido' OR status = 'realizado') 
          AND completed_at IS NOT NULL 
          AND ABS(EXTRACT(EPOCH FROM (completed_at - due_at))) > 15 * 60)
        OR (status = 'pendente' OR status = 'agendado') AND current_utc > due_at
        THEN 1 
        ELSE NULL 
      END) as atrasados,
      COUNT(CASE 
        WHEN (status = 'pendente' OR status = 'agendado') AND current_utc <= due_at
        THEN 1 
        ELSE NULL 
      END) as faltando
    FROM public.v_conquests_occurrences
    WHERE context_id = p_context_id
      AND due_at >= p_range_start
      AND due_at <= p_range_end
    GROUP BY category
  LOOP
    -- Add to totals
    total_planejados := total_planejados + cat_record.planejados;
    total_concluidos := total_concluidos + cat_record.concluidos;
    total_faltando := total_faltando + cat_record.faltando;
    total_atrasados := total_atrasados + cat_record.atrasados;
    total_cancelados := total_cancelados + cat_record.cancelados;
    
    -- Add to by_category object
    by_category := by_category || jsonb_build_object(
      cat_record.category,
      jsonb_build_object(
        'planejados', cat_record.planejados,
        'concluidos', cat_record.concluidos,
        'faltando', cat_record.faltando,
        'atrasados', cat_record.atrasados,
        'cancelados', cat_record.cancelados,
        'aderencia_pct', CASE 
          WHEN cat_record.planejados > 0 
          THEN ROUND((cat_record.concluidos::numeric / cat_record.planejados::numeric) * 100, 1)
          ELSE 0 
        END
      )
    );
  END LOOP;
  
  -- Build final result
  result := jsonb_build_object(
    'planejados', total_planejados,
    'concluidos', total_concluidos,
    'faltando', total_faltando,
    'atrasados', total_atrasados,
    'cancelados', total_cancelados,
    'aderencia_pct', CASE 
      WHEN total_planejados > 0 
      THEN ROUND((total_concluidos::numeric / total_planejados::numeric) * 100, 1)
      ELSE 0 
    END,
    'by_category', by_category
  );
  
  RETURN result;
END;
$function$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medication_occurrences_context_due 
ON public.medication_occurrences (patient_profile_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_appointments_context_due 
ON public.appointments (patient_profile_id, data_agendamento);