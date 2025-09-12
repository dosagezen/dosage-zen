-- Create enum for medication occurrence status
CREATE TYPE medication_occurrence_status AS ENUM ('pendente', 'concluido', 'excluido');

-- Create medication_occurrences table
CREATE TABLE medication_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_profile_id uuid NOT NULL REFERENCES profiles(id),
  scheduled_at timestamptz NOT NULL,
  status medication_occurrence_status DEFAULT 'pendente',
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries (without DATE function)
CREATE INDEX idx_medication_occurrences_med_scheduled ON medication_occurrences(medication_id, scheduled_at);
CREATE INDEX idx_medication_occurrences_patient_scheduled ON medication_occurrences(patient_profile_id, scheduled_at);

-- Enable RLS
ALTER TABLE medication_occurrences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their medication occurrences" 
ON medication_occurrences 
FOR SELECT 
USING (
  (patient_profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) 
  OR 
  (patient_profile_id IN (
    SELECT collaborations.patient_profile_id 
    FROM collaborations 
    WHERE collaborations.collaborator_profile_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    ) 
    AND collaborations.is_active = true
  ))
);

CREATE POLICY "Patients can update medication occurrence status" 
ON medication_occurrences 
FOR UPDATE 
USING (
  (patient_profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) 
  OR 
  (patient_profile_id IN (
    SELECT collaborations.patient_profile_id 
    FROM collaborations 
    WHERE collaborations.collaborator_profile_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    ) 
    AND collaborations.is_active = true 
    AND collaborations.collaborator_role = ANY (ARRAY['acompanhante'::app_role, 'gestor'::app_role])
  ))
);

CREATE POLICY "System can insert medication occurrences" 
ON medication_occurrences 
FOR INSERT 
WITH CHECK (true);

-- Function to upsert medication occurrences
CREATE OR REPLACE FUNCTION fn_upsert_medication_occurrences(
  p_medication_id uuid,
  p_patient_profile_id uuid,
  p_horarios text[],
  p_data_inicio date,
  p_data_fim date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing future occurrences for this medication
  DELETE FROM medication_occurrences 
  WHERE medication_id = p_medication_id 
  AND scheduled_at >= CURRENT_DATE;
  
  -- Insert new occurrences
  INSERT INTO medication_occurrences (medication_id, patient_profile_id, scheduled_at)
  SELECT 
    p_medication_id,
    p_patient_profile_id,
    (current_date + (day_offset || ' days')::interval + horario::time) AT TIME ZONE 'UTC'
  FROM 
    generate_series(0, COALESCE(p_data_fim, CURRENT_DATE + interval '1 year') - COALESCE(p_data_inicio, CURRENT_DATE)) AS day_offset,
    unnest(p_horarios) AS horario
  WHERE 
    (CURRENT_DATE + (day_offset || ' days')::interval) >= COALESCE(p_data_inicio, CURRENT_DATE)
    AND (p_data_fim IS NULL OR (CURRENT_DATE + (day_offset || ' days')::interval) <= p_data_fim);
END;
$$;

-- Function to mark occurrence status
CREATE OR REPLACE FUNCTION fn_mark_occurrence(
  p_occurrence_id uuid,
  p_status medication_occurrence_status
)
RETURNS medication_occurrences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result medication_occurrences;
BEGIN
  UPDATE medication_occurrences 
  SET 
    status = p_status,
    completed_at = CASE WHEN p_status IN ('concluido', 'excluido') THEN now() ELSE NULL END,
    completed_by = CASE WHEN p_status IN ('concluido', 'excluido') THEN get_user_profile_id(auth.uid()) ELSE NULL END,
    updated_at = now()
  WHERE id = p_occurrence_id
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Function to get next occurrence for a medication
CREATE OR REPLACE FUNCTION fn_next_occurrence(p_medication_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT scheduled_at 
  FROM medication_occurrences 
  WHERE medication_id = p_medication_id 
  AND status = 'pendente' 
  AND scheduled_at >= now()
  ORDER BY scheduled_at ASC 
  LIMIT 1;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_medication_occurrences_updated_at
BEFORE UPDATE ON medication_occurrences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();