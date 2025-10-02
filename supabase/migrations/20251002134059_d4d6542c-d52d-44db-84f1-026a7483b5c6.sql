-- Fix fn_reports_insights to remove nested aggregates
DROP FUNCTION IF EXISTS public.fn_reports_insights(uuid, text);

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
  
  -- Consecutive 100% Days - FIXED: removed nested aggregate
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
  ),
  streak_counts AS (
    SELECT COUNT(*) as streak_length
    FROM streaks
    WHERE is_perfect = true
    GROUP BY streak_group
  )
  SELECT COALESCE(MAX(streak_length), 0)
  INTO consecutive_days
  FROM streak_counts;
  
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