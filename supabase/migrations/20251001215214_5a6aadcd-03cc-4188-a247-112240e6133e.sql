-- Create performance indexes for reports
CREATE INDEX IF NOT EXISTS idx_med_occ_context_scheduled 
ON medication_occurrences(patient_profile_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_appointments_context_date 
ON appointments(patient_profile_id, data_agendamento);

-- Function: fn_reports_summary
-- Returns aggregated data for charts and totals
CREATE OR REPLACE FUNCTION public.fn_reports_summary(
  p_context_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz,
  p_category text DEFAULT 'todas',
  p_tz text DEFAULT 'UTC'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_planejados integer := 0;
  total_concluidos integer := 0;
  total_retardatarios integer := 0;
  total_faltando integer := 0;
  total_atrasados integer := 0;
  total_excluidos integer := 0;
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
      COUNT(CASE WHEN status = 'excluido' OR status = 'cancelado' THEN 1 END) as excluidos,
      COUNT(CASE WHEN status = 'concluido' OR status = 'realizado' THEN 1 END) as concluidos,
      -- Retardatários: concluídos mas com atraso significativo (>30min)
      COUNT(CASE 
        WHEN (status = 'concluido' OR status = 'realizado') 
          AND completed_at IS NOT NULL 
          AND EXTRACT(EPOCH FROM (completed_at - due_at)) > 1800
        THEN 1 
      END) as retardatarios,
      COUNT(CASE 
        WHEN (status = 'pendente' OR status = 'agendado') AND current_utc > due_at
        THEN 1 
      END) as atrasados,
      COUNT(CASE 
        WHEN (status = 'pendente' OR status = 'agendado') AND current_utc <= due_at
        THEN 1 
      END) as faltando
    FROM public.v_conquests_occurrences
    WHERE context_id = p_context_id
      AND due_at >= p_range_start
      AND due_at <= p_range_end
      AND (p_category = 'todas' OR category = p_category)
    GROUP BY category
  LOOP
    total_planejados := total_planejados + cat_record.planejados;
    total_concluidos := total_concluidos + cat_record.concluidos;
    total_retardatarios := total_retardatarios + cat_record.retardatarios;
    total_faltando := total_faltando + cat_record.faltando;
    total_atrasados := total_atrasados + cat_record.atrasados;
    total_excluidos := total_excluidos + cat_record.excluidos;
    
    by_category := by_category || jsonb_build_object(
      cat_record.category,
      jsonb_build_object(
        'planejados', cat_record.planejados,
        'concluidos', cat_record.concluidos,
        'retardatarios', cat_record.retardatarios,
        'faltando', cat_record.faltando,
        'atrasados', cat_record.atrasados,
        'excluidos', cat_record.excluidos
      )
    );
  END LOOP;
  
  -- Build final result with percentages
  result := jsonb_build_object(
    'totals', jsonb_build_object(
      'planejados', total_planejados,
      'concluidos', total_concluidos,
      'retardatarios', total_retardatarios,
      'faltando', total_faltando,
      'atrasados', total_atrasados,
      'excluidos', total_excluidos,
      'concluidos_pct', CASE 
        WHEN total_planejados > 0 
        THEN ROUND((total_concluidos::numeric / total_planejados::numeric) * 100, 1)
        ELSE 0 
      END,
      'retardatarios_pct', CASE 
        WHEN total_planejados > 0 
        THEN ROUND((total_retardatarios::numeric / total_planejados::numeric) * 100, 1)
        ELSE 0 
      END,
      'faltando_pct', CASE 
        WHEN total_planejados > 0 
        THEN ROUND((total_faltando::numeric / total_planejados::numeric) * 100, 1)
        ELSE 0 
      END,
      'atrasados_pct', CASE 
        WHEN total_planejados > 0 
        THEN ROUND((total_atrasados::numeric / total_planejados::numeric) * 100, 1)
        ELSE 0 
      END,
      'excluidos_pct', CASE 
        WHEN total_planejados > 0 
        THEN ROUND((total_excluidos::numeric / total_planejados::numeric) * 100, 1)
        ELSE 0 
      END
    ),
    'by_category', by_category
  );
  
  RETURN result;
END;
$$;

-- Function: fn_reports_insights
-- Returns calculated insights (best week, most forgotten, consecutive days, trend)
CREATE OR REPLACE FUNCTION public.fn_reports_insights(
  p_context_id uuid,
  p_tz text DEFAULT 'UTC'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  best_week_start date;
  best_week_pct numeric;
  most_forgotten_item text;
  most_forgotten_pct numeric;
  consecutive_days integer;
  trend_direction text;
  trend_value numeric;
  user_profile_id uuid;
BEGIN
  SELECT get_user_profile_id(auth.uid()) INTO user_profile_id;
  
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
  
  -- Best Week (last 12 weeks)
  SELECT 
    week_start,
    adherence_pct
  INTO best_week_start, best_week_pct
  FROM (
    SELECT 
      DATE_TRUNC('week', (due_at AT TIME ZONE p_tz)::date) as week_start,
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'excluido', 'cancelado')) > 0
        THEN ROUND(
          (COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado'))::numeric / 
           COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'excluido', 'cancelado'))::numeric) * 100, 
          1
        )
        ELSE 0 
      END as adherence_pct
    FROM v_conquests_occurrences
    WHERE context_id = p_context_id
      AND due_at >= (now() - interval '12 weeks')
      AND due_at < now()
    GROUP BY week_start
    HAVING COUNT(*) > 0
  ) weeks
  ORDER BY adherence_pct DESC, week_start DESC
  LIMIT 1;
  
  -- Most Forgotten (by category, last 30 days)
  SELECT 
    category,
    missed_pct
  INTO most_forgotten_item, most_forgotten_pct
  FROM (
    SELECT 
      category,
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'atrasado', 'excluido')) > 0
        THEN ROUND(
          (COUNT(*) FILTER (WHERE status = 'atrasado')::numeric / 
           COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'atrasado', 'excluido'))::numeric) * 100, 
          1
        )
        ELSE 0 
      END as missed_pct
    FROM v_conquests_occurrences
    WHERE context_id = p_context_id
      AND due_at >= (now() - interval '30 days')
      AND due_at < now()
    GROUP BY category
    HAVING COUNT(*) > 3
  ) categories
  ORDER BY missed_pct DESC
  LIMIT 1;
  
  -- Consecutive 100% Days
  WITH daily_adherence AS (
    SELECT 
      (due_at AT TIME ZONE p_tz)::date as day,
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'excluido', 'cancelado')) > 0
        THEN (COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado')) = 
              COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'excluido', 'cancelado')))
        ELSE false
      END as is_perfect
    FROM v_conquests_occurrences
    WHERE context_id = p_context_id
      AND due_at < now()
      AND due_at >= (now() - interval '90 days')
    GROUP BY day
  ),
  streaks AS (
    SELECT 
      day,
      is_perfect,
      day - (ROW_NUMBER() OVER (PARTITION BY is_perfect ORDER BY day))::integer as streak_group
    FROM daily_adherence
  )
  SELECT COALESCE(MAX(COUNT(*)), 0)
  INTO consecutive_days
  FROM streaks
  WHERE is_perfect = true
  GROUP BY streak_group;
  
  -- Trend (last 7 days vs previous 7 days)
  WITH recent_adherence AS (
    SELECT 
      CASE 
        WHEN due_at >= (now() - interval '7 days') THEN 'current'
        ELSE 'previous'
      END as period,
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'excluido', 'cancelado')) > 0
        THEN ROUND(
          (COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado'))::numeric / 
           COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'excluido', 'cancelado'))::numeric) * 100, 
          1
        )
        ELSE 0 
      END as adherence_pct
    FROM v_conquests_occurrences
    WHERE context_id = p_context_id
      AND due_at >= (now() - interval '14 days')
      AND due_at < now()
    GROUP BY period
  )
  SELECT 
    CASE 
      WHEN MAX(CASE WHEN period = 'current' THEN adherence_pct END) > 
           MAX(CASE WHEN period = 'previous' THEN adherence_pct END) THEN 'subindo'
      WHEN MAX(CASE WHEN period = 'current' THEN adherence_pct END) < 
           MAX(CASE WHEN period = 'previous' THEN adherence_pct END) THEN 'descendo'
      ELSE 'estável'
    END,
    ABS(
      COALESCE(MAX(CASE WHEN period = 'current' THEN adherence_pct END), 0) - 
      COALESCE(MAX(CASE WHEN period = 'previous' THEN adherence_pct END), 0)
    )
  INTO trend_direction, trend_value
  FROM recent_adherence;
  
  -- Build result
  result := jsonb_build_object(
    'best_week', jsonb_build_object(
      'start_date', best_week_start,
      'adherence_pct', COALESCE(best_week_pct, 0)
    ),
    'most_forgotten', jsonb_build_object(
      'item', COALESCE(most_forgotten_item, 'N/A'),
      'missed_pct', COALESCE(most_forgotten_pct, 0)
    ),
    'consecutive_days', COALESCE(consecutive_days, 0),
    'trend', jsonb_build_object(
      'direction', COALESCE(trend_direction, 'estável'),
      'value', COALESCE(trend_value, 0)
    )
  );
  
  RETURN result;
END;
$$;

-- Function: fn_reports_historical
-- Returns monthly adherence evolution
CREATE OR REPLACE FUNCTION public.fn_reports_historical(
  p_context_id uuid,
  p_months integer DEFAULT 4,
  p_tz text DEFAULT 'UTC'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '[]';
  month_record record;
  user_profile_id uuid;
BEGIN
  SELECT get_user_profile_id(auth.uid()) INTO user_profile_id;
  
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
  
  -- Get monthly adherence
  FOR month_record IN
    SELECT 
      TO_CHAR(DATE_TRUNC('month', (due_at AT TIME ZONE p_tz)::date), 'YYYY-MM') as month,
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'excluido', 'cancelado')) > 0
        THEN ROUND(
          (COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado'))::numeric / 
           COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado', 'excluido', 'cancelado'))::numeric) * 100, 
          1
        )
        ELSE 0 
      END as adherence_pct,
      COUNT(*) FILTER (WHERE status IN ('concluido', 'realizado')) as completed,
      COUNT(*) as total
    FROM v_conquests_occurrences
    WHERE context_id = p_context_id
      AND due_at >= DATE_TRUNC('month', now() - (p_months || ' months')::interval)
      AND due_at < now()
    GROUP BY DATE_TRUNC('month', (due_at AT TIME ZONE p_tz)::date)
    ORDER BY month ASC
  LOOP
    result := result || jsonb_build_object(
      'month', month_record.month,
      'adherence_pct', month_record.adherence_pct,
      'completed', month_record.completed,
      'total', month_record.total
    );
  END LOOP;
  
  RETURN result;
END;
$$;