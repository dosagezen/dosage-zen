-- Fix security issue with v_conquests_occurrences view
-- The view was not properly secured and could bypass RLS policies

-- First, recreate the view with security_invoker option
-- This makes the view use the caller's permissions, not the creator's
DROP VIEW IF EXISTS public.v_conquests_occurrences;

CREATE VIEW public.v_conquests_occurrences 
WITH (security_invoker = true)
AS
SELECT 
  mo.patient_profile_id AS context_id,
  'medication'::text AS source,
  'medicacao'::text AS category,
  mo.scheduled_at AS due_at,
  mo.status::text AS status,
  mo.completed_at,
  mo.completed_by,
  mo.id AS occurrence_id
FROM medication_occurrences mo
WHERE mo.patient_profile_id IS NOT NULL
UNION ALL
SELECT 
  a.patient_profile_id AS context_id,
  'agenda'::text AS source,
  a.tipo AS category,
  a.data_agendamento AS due_at,
  a.status,
  CASE
    WHEN a.status = 'realizado' THEN a.updated_at
    WHEN a.status = 'cancelado' THEN a.updated_at
    ELSE NULL
  END AS completed_at,
  NULL::uuid AS completed_by,
  a.id AS occurrence_id
FROM appointments a
WHERE a.patient_profile_id IS NOT NULL;

-- Add documentation
COMMENT ON VIEW public.v_conquests_occurrences IS 
'Unified view of medication occurrences and appointments for conquests/achievements tracking. Uses security_invoker to ensure proper RLS enforcement from underlying tables.';

-- Verify the view now properly respects RLS
-- The security_invoker option ensures that queries against this view
-- will be checked against the RLS policies of medication_occurrences and appointments
-- using the permissions of the querying user, not the view creator