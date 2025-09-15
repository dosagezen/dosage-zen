-- Create enums for appointments
CREATE TYPE appointment_category AS ENUM ('consulta', 'exame', 'atividade');
CREATE TYPE appointment_status AS ENUM ('ativo', 'concluido', 'cancelado');
CREATE TYPE occurrence_status AS ENUM ('pendente', 'concluido', 'excluido');
CREATE TYPE recurrence_freq AS ENUM ('none', 'weekly');

-- Main appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  context_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  category appointment_category NOT NULL,
  title TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  notes TEXT,
  status appointment_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Details by category
CREATE TABLE public.consultations (
  appointment_id UUID NOT NULL PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  specialty TEXT,
  professional TEXT
);

CREATE TABLE public.exams (
  appointment_id UUID NOT NULL PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  exam_type TEXT,
  preparation TEXT
);

CREATE TABLE public.activities (
  appointment_id UUID NOT NULL PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  activity_type TEXT,
  weekdays INTEGER[],
  repeat recurrence_freq NOT NULL DEFAULT 'none'
);

-- Recurrence rules
CREATE TABLE public.recurrence_rules (
  appointment_id UUID NOT NULL PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  freq recurrence_freq NOT NULL DEFAULT 'none',
  interval_days INTEGER NOT NULL DEFAULT 1,
  byweekday INTEGER[],
  until_date DATE
);

-- Appointment occurrences
CREATE TABLE public.appointment_occurrences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  status occurrence_status NOT NULL DEFAULT 'pendente',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID
);

-- Create indexes
CREATE INDEX idx_appointments_context_start ON public.appointments(context_id, start_at);
CREATE INDEX idx_appointments_context_category_start ON public.appointments(context_id, category, start_at);
CREATE INDEX idx_occurrences_appointment_start ON public.appointment_occurrences(appointment_id, start_at);
CREATE INDEX idx_occurrences_appointment_start_status ON public.appointment_occurrences(appointment_id, start_at, status);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_occurrences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments (everyone can read, only gestor can write)
CREATE POLICY "Users can view appointments in their context" 
ON public.appointments FOR SELECT 
USING (
  context_id IN (
    SELECT patient_profile_id FROM collaborations 
    WHERE collaborator_profile_id = get_user_profile_id(auth.uid()) 
    AND is_active = true
  ) OR 
  context_id = get_user_profile_id(auth.uid())
);

CREATE POLICY "Gestors can create appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (
  context_id IN (
    SELECT patient_profile_id FROM collaborations 
    WHERE collaborator_profile_id = get_user_profile_id(auth.uid()) 
    AND is_active = true 
    AND collaborator_role = 'gestor'
  ) OR 
  context_id = get_user_profile_id(auth.uid())
);

CREATE POLICY "Gestors can update appointments" 
ON public.appointments FOR UPDATE 
USING (
  context_id IN (
    SELECT patient_profile_id FROM collaborations 
    WHERE collaborator_profile_id = get_user_profile_id(auth.uid()) 
    AND is_active = true 
    AND collaborator_role = 'gestor'
  ) OR 
  context_id = get_user_profile_id(auth.uid())
);

CREATE POLICY "Gestors can delete appointments" 
ON public.appointments FOR DELETE 
USING (
  context_id IN (
    SELECT patient_profile_id FROM collaborations 
    WHERE collaborator_profile_id = get_user_profile_id(auth.uid()) 
    AND is_active = true 
    AND collaborator_role = 'gestor'
  ) OR 
  context_id = get_user_profile_id(auth.uid())
);

-- RLS Policies for detail tables (same pattern)
CREATE POLICY "Users can view consultations" ON public.consultations FOR SELECT 
USING (appointment_id IN (SELECT id FROM appointments));
CREATE POLICY "Gestors can manage consultations" ON public.consultations FOR ALL 
USING (appointment_id IN (SELECT id FROM appointments));

CREATE POLICY "Users can view exams" ON public.exams FOR SELECT 
USING (appointment_id IN (SELECT id FROM appointments));
CREATE POLICY "Gestors can manage exams" ON public.exams FOR ALL 
USING (appointment_id IN (SELECT id FROM appointments));

CREATE POLICY "Users can view activities" ON public.activities FOR SELECT 
USING (appointment_id IN (SELECT id FROM appointments));
CREATE POLICY "Gestors can manage activities" ON public.activities FOR ALL 
USING (appointment_id IN (SELECT id FROM appointments));

CREATE POLICY "Users can view recurrence rules" ON public.recurrence_rules FOR SELECT 
USING (appointment_id IN (SELECT id FROM appointments));
CREATE POLICY "Gestors can manage recurrence rules" ON public.recurrence_rules FOR ALL 
USING (appointment_id IN (SELECT id FROM appointments));

-- RLS Policies for occurrences
CREATE POLICY "Users can view occurrences" ON public.appointment_occurrences FOR SELECT 
USING (appointment_id IN (SELECT id FROM appointments));

CREATE POLICY "Gestors can manage occurrences" ON public.appointment_occurrences FOR ALL 
USING (appointment_id IN (SELECT id FROM appointments));

-- System can insert occurrences
CREATE POLICY "System can insert occurrences" ON public.appointment_occurrences FOR INSERT 
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate occurrences for appointments
CREATE OR REPLACE FUNCTION public.fn_generate_appointment_occurrences(
  p_appointment_id UUID,
  p_start_at TIMESTAMPTZ,
  p_duration_min INTEGER,
  p_freq recurrence_freq DEFAULT 'none',
  p_weekdays INTEGER[] DEFAULT NULL,
  p_until_date DATE DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  end_date DATE;
  current_date DATE;
  occurrence_start TIMESTAMPTZ;
  occurrence_end TIMESTAMPTZ;
BEGIN
  -- Set end date (max 60 days from now or until_date)
  end_date := LEAST(
    COALESCE(p_until_date, CURRENT_DATE + INTERVAL '60 days'),
    CURRENT_DATE + INTERVAL '60 days'
  );
  
  -- Delete existing future occurrences
  DELETE FROM appointment_occurrences 
  WHERE appointment_id = p_appointment_id 
  AND start_at >= CURRENT_DATE;
  
  IF p_freq = 'none' THEN
    -- Single occurrence
    occurrence_end := CASE 
      WHEN p_duration_min > 0 THEN p_start_at + (p_duration_min || ' minutes')::INTERVAL
      ELSE NULL
    END;
    
    INSERT INTO appointment_occurrences (appointment_id, start_at, end_at)
    VALUES (p_appointment_id, p_start_at, occurrence_end);
    
  ELSIF p_freq = 'weekly' AND p_weekdays IS NOT NULL THEN
    -- Weekly recurrence
    current_date := p_start_at::DATE;
    
    WHILE current_date <= end_date LOOP
      -- Check if current day is in weekdays array (0=Sunday, 1=Monday, etc.)
      IF EXTRACT(DOW FROM current_date)::INTEGER = ANY(p_weekdays) THEN
        occurrence_start := current_date + (p_start_at::TIME);
        occurrence_end := CASE 
          WHEN p_duration_min > 0 THEN occurrence_start + (p_duration_min || ' minutes')::INTERVAL
          ELSE NULL
        END;
        
        INSERT INTO appointment_occurrences (appointment_id, start_at, end_at)
        VALUES (p_appointment_id, occurrence_start, occurrence_end);
      END IF;
      
      current_date := current_date + INTERVAL '1 day';
    END LOOP;
  END IF;
END;
$$;