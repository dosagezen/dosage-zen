-- ============================================================
-- FASE 1 & 3: Limpeza Completa de Duplicatas (Primeiro passo)
-- ============================================================

-- Remove TODAS as duplicatas existentes no sistema (mantendo a mais recente/concluída)
DELETE FROM medication_occurrences
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id, 
      ROW_NUMBER() OVER (
        PARTITION BY medication_id, scheduled_at 
        ORDER BY 
          CASE WHEN status = 'concluido' THEN 0 ELSE 1 END,
          created_at DESC
      ) as rn
    FROM medication_occurrences
    WHERE status != 'excluido'
  ) sub 
  WHERE rn > 1
);

-- Log de auditoria
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO deleted_count
  FROM (
    SELECT 
      id, 
      ROW_NUMBER() OVER (
        PARTITION BY medication_id, scheduled_at 
        ORDER BY 
          CASE WHEN status = 'concluido' THEN 0 ELSE 1 END,
          created_at DESC
      ) as rn
    FROM medication_occurrences
    WHERE status != 'excluido'
  ) sub 
  WHERE rn > 1;
  
  RAISE NOTICE 'Limpeza global concluída. Duplicatas removidas: %', deleted_count;
END $$;

-- ============================================================
-- FASE 2.1: Adicionar UNIQUE INDEX
-- ============================================================

-- Índice único para prevenir duplicatas (exceto registros excluídos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_medication_occurrences_unique 
ON medication_occurrences (medication_id, scheduled_at) 
WHERE status != 'excluido';

-- ============================================================
-- FASE 2.2: Melhorar RPC Function
-- ============================================================

-- Remove função antiga (sem timezone)
DROP FUNCTION IF EXISTS public.fn_upsert_medication_occurrences(uuid, uuid, text[], date, date);

-- Recria função melhorada com proteção contra race conditions
CREATE OR REPLACE FUNCTION public.fn_upsert_medication_occurrences(
  p_medication_id uuid,
  p_patient_profile_id uuid,
  p_horarios text[],
  p_data_inicio date,
  p_data_fim date,
  p_tz text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  end_date date;
  today_date date;
BEGIN
  -- Lock da medication para evitar race condition
  PERFORM 1 FROM medications 
  WHERE id = p_medication_id 
  FOR UPDATE;
  
  -- Determinar "today" baseado no timezone do usuário
  today_date := (now() AT TIME ZONE p_tz)::date;

  -- Limitar geração a D+7 para prevenir problemas de performance
  end_date := LEAST(
    COALESCE(p_data_fim, today_date + interval '7 days'), 
    today_date + interval '7 days'
  );
  
  -- Processar apenas se data_inicio não for muito no futuro
  IF COALESCE(p_data_inicio, today_date) > today_date + interval '7 days' THEN
    RETURN;
  END IF;
  
  -- Deletar occurrences futuras existentes (a partir de hoje)
  DELETE FROM medication_occurrences 
  WHERE medication_id = p_medication_id 
    AND (scheduled_at AT TIME ZONE p_tz)::date >= today_date;
  
  -- Inserir novas occurrences com proteção contra duplicatas
  INSERT INTO medication_occurrences (medication_id, patient_profile_id, scheduled_at)
  SELECT 
    p_medication_id,
    p_patient_profile_id,
    ( (today_date + (day_offset || ' days')::interval + horario::time) AT TIME ZONE p_tz )
  FROM 
    generate_series(0, end_date - today_date) AS day_offset,
    unnest(p_horarios) AS horario
  WHERE 
    (today_date + (day_offset || ' days')::interval) >= COALESCE(p_data_inicio, today_date)
    AND (today_date + (day_offset || ' days')::interval) <= end_date
    AND array_length(p_horarios, 1) > 0
  ON CONFLICT (medication_id, scheduled_at) 
  WHERE status != 'excluido'
  DO NOTHING;
  
  -- Log para debugging
  RAISE LOG 'Generated occurrences (tz=%) for med_id: %, horarios: %, days: % to %', 
    p_tz, p_medication_id, array_length(p_horarios, 1), today_date, end_date;
END;
$function$;