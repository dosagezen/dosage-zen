-- Set the v_conquests_occurrences view to use security invoker
-- This means the view will execute with the permissions of the user calling it
-- Combined with RLS policies on the underlying tables, this prevents unauthorized access

-- First, we need to recreate the view with security invoker set
-- Get the existing view definition and recreate it with security_invoker
DROP VIEW IF EXISTS public.v_conquests_occurrences;

CREATE VIEW public.v_conquests_occurrences
WITH (security_invoker = true)
AS
-- Medication occurrences
SELECT 
  'medicacao'::text as category,
  'medication_occurrences'::text as source,
  mo.id as occurrence_id,
  mo.patient_profile_id as context_id,
  mo.scheduled_at as due_at,
  mo.completed_at,
  mo.completed_by,
  mo.status::text as status
FROM medication_occurrences mo

UNION ALL

-- Appointments (consultas and exames)
SELECT 
  a.tipo::text as category,
  'appointments'::text as source,
  a.id as occurrence_id,
  a.patient_profile_id as context_id,
  a.data_agendamento as due_at,
  CASE 
    WHEN a.status = 'realizado' THEN a.data_agendamento
    ELSE NULL 
  END as completed_at,
  NULL::uuid as completed_by,
  a.status::text as status
FROM appointments a
WHERE a.tipo IN ('consulta', 'exame');

-- Grant SELECT permission to authenticated users
-- The actual access control is handled by RLS policies on the underlying tables
GRANT SELECT ON public.v_conquests_occurrences TO authenticated;