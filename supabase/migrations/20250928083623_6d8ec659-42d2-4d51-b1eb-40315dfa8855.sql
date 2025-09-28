-- Fix medications with empty horarios but existing occurrences
-- Reconstruct horarios array based on existing medication_occurrences

-- Fix Glifarge XR (should have 08:00 and 20:00)
UPDATE medications 
SET horarios = '["08:00", "20:00"]'::jsonb
WHERE nome = 'Glifarge XR' AND horarios = '[]'::jsonb;

-- Fix Naprix (should have 08:00)  
UPDATE medications
SET horarios = '["08:00"]'::jsonb
WHERE nome = 'Naprix' AND horarios = '[]'::jsonb;

-- General fix for any other medications with empty horarios but existing occurrences
-- This will reconstruct horarios based on distinct scheduled times from today's occurrences
UPDATE medications 
SET horarios = (
  SELECT jsonb_agg(DISTINCT to_char(scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') ORDER BY to_char(scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'))
  FROM medication_occurrences 
  WHERE medication_occurrences.medication_id = medications.id
    AND scheduled_at::date = CURRENT_DATE
)
WHERE horarios = '[]'::jsonb 
  AND EXISTS (
    SELECT 1 FROM medication_occurrences 
    WHERE medication_occurrences.medication_id = medications.id
  )
  AND (
    SELECT COUNT(DISTINCT to_char(scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'))
    FROM medication_occurrences 
    WHERE medication_occurrences.medication_id = medications.id
      AND scheduled_at::date = CURRENT_DATE
  ) > 0;