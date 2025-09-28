-- Update the fn_conquests_summary function to fix classification logic
CREATE OR REPLACE FUNCTION public.fn_conquests_summary(p_context_id uuid, p_range_start timestamp with time zone, p_range_end timestamp with time zone, p_tz text DEFAULT 'UTC'::text)
 RETURNS jsonb
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
  
  -- Calculate totals by category with corrected logic
  FOR cat_record IN 
    SELECT 
      category,
      COUNT(*) as planejados,
      -- Cancelados: explicitly excluded/canceled items
      COUNT(CASE 
        WHEN status = 'excluido' OR status = 'cancelado' THEN 1 
        ELSE NULL 
      END) as cancelados,
      -- Concluidos: all completed items regardless of timing
      COUNT(CASE 
        WHEN status = 'concluido' OR status = 'realizado' THEN 1 
        ELSE NULL 
      END) as concluidos,
      -- Atrasados: only pending items that are past due
      COUNT(CASE 
        WHEN (status = 'pendente' OR status = 'agendado') AND current_utc > due_at
        THEN 1 
        ELSE NULL 
      END) as atrasados,
      -- Faltando: pending items still within their timeframe
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
          WHEN (cat_record.concluidos + cat_record.atrasados + cat_record.cancelados) > 0 
          THEN ROUND((cat_record.concluidos::numeric / (cat_record.concluidos + cat_record.atrasados + cat_record.cancelados)::numeric) * 100, 1)
          ELSE 0 
        END
      )
    );
  END LOOP;
  
  -- Build final result with improved adherence calculation
  result := jsonb_build_object(
    'planejados', total_planejados,
    'concluidos', total_concluidos,
    'faltando', total_faltando,
    'atrasados', total_atrasados,
    'cancelados', total_cancelados,
    'aderencia_pct', CASE 
      WHEN (total_concluidos + total_atrasados + total_cancelados) > 0 
      THEN ROUND((total_concluidos::numeric / (total_concluidos + total_atrasados + total_cancelados)::numeric) * 100, 1)
      ELSE 0 
    END,
    'by_category', by_category
  );
  
  RETURN result;
END;
$function$;