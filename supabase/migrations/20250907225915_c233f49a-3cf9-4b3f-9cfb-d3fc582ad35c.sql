-- Criar tabela de medicações
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_profile_id UUID NOT NULL,
  nome TEXT NOT NULL,
  dosagem TEXT NOT NULL,
  forma TEXT NOT NULL, -- comprimido, xarope, etc
  frequencia TEXT NOT NULL, -- "1x ao dia", "2x ao dia", etc
  horarios JSONB NOT NULL DEFAULT '[]', -- array de horários ["08:00", "20:00"]
  estoque INTEGER DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de consultas médicas (inclui consultas, exames e atividades)
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_profile_id UUID NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'consulta', -- consulta, exame, atividade
  titulo TEXT NOT NULL,
  especialidade TEXT,
  medico_profissional TEXT,
  local_endereco TEXT,
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  duracao_minutos INTEGER DEFAULT 60,
  status TEXT DEFAULT 'agendado', -- agendado, realizado, cancelado
  observacoes TEXT,
  resultado TEXT, -- para exames
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de horários de medicação (para tracking)
CREATE TABLE public.medication_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL,
  patient_profile_id UUID NOT NULL,
  horario_programado TIME NOT NULL,
  data_programada DATE NOT NULL,
  status TEXT DEFAULT 'pendente', -- pendente, tomado, perdido
  horario_tomado TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(medication_id, data_programada, horario_programado)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas para medicações
CREATE POLICY "Patients can view their own medications" 
ON public.medications 
FOR SELECT 
USING (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true
  )
);

CREATE POLICY "Patients can insert their own medications" 
ON public.medications 
FOR INSERT 
WITH CHECK (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true AND collaborator_role IN ('acompanhante', 'gestor')
  )
);

CREATE POLICY "Patients can update their own medications" 
ON public.medications 
FOR UPDATE 
USING (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true AND collaborator_role IN ('acompanhante', 'gestor')
  )
);

CREATE POLICY "Patients can delete their own medications" 
ON public.medications 
FOR DELETE 
USING (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true AND collaborator_role IN ('acompanhante', 'gestor')
  )
);

-- Políticas para consultas/exames/atividades
CREATE POLICY "Patients can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true
  )
);

CREATE POLICY "Patients can insert their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true AND collaborator_role IN ('acompanhante', 'gestor')
  )
);

CREATE POLICY "Patients can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true AND collaborator_role IN ('acompanhante', 'gestor')
  )
);

CREATE POLICY "Patients can delete their own appointments" 
ON public.appointments 
FOR DELETE 
USING (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true AND collaborator_role IN ('acompanhante', 'gestor')
  )
);

-- Políticas para horários de medicação
CREATE POLICY "Patients can view their medication schedules" 
ON public.medication_schedules 
FOR SELECT 
USING (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true
  )
);

CREATE POLICY "Patients can insert their medication schedules" 
ON public.medication_schedules 
FOR INSERT 
WITH CHECK (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true AND collaborator_role IN ('acompanhante', 'gestor')
  )
);

CREATE POLICY "Patients can update their medication schedules" 
ON public.medication_schedules 
FOR UPDATE 
USING (
  patient_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR 
  patient_profile_id IN (
    SELECT patient_profile_id FROM public.collaborations 
    WHERE collaborator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND is_active = true AND collaborator_role IN ('acompanhante', 'gestor')
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_schedules_updated_at
BEFORE UPDATE ON public.medication_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_medications_patient_profile_id ON public.medications(patient_profile_id);
CREATE INDEX idx_medications_ativo ON public.medications(ativo);
CREATE INDEX idx_appointments_patient_profile_id ON public.appointments(patient_profile_id);
CREATE INDEX idx_appointments_data_agendamento ON public.appointments(data_agendamento);
CREATE INDEX idx_medication_schedules_patient_profile_id ON public.medication_schedules(patient_profile_id);
CREATE INDEX idx_medication_schedules_data_programada ON public.medication_schedules(data_programada);
CREATE INDEX idx_medication_schedules_status ON public.medication_schedules(status);