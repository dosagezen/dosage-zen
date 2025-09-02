-- Create enums for the system
CREATE TYPE public.app_role AS ENUM ('paciente', 'acompanhante', 'cuidador', 'admin');
CREATE TYPE public.invitation_status AS ENUM ('pendente', 'aceito', 'recusado');
CREATE TYPE public.subscription_status AS ENUM ('ativo', 'inativo', 'cancelado');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  celular TEXT,
  codigo TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  is_gestor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table for multi-context roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  context_patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, context_patient_id, role)
);

-- Create collaborations table
CREATE TABLE public.collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collaborator_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collaborator_role public.app_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_profile_id, collaborator_profile_id)
);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collaborator_code TEXT NOT NULL,
  collaborator_role public.app_role NOT NULL,
  status public.invitation_status DEFAULT 'pendente',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status public.subscription_status DEFAULT 'inativo',
  plan_name TEXT,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view roles in their patient context" ON public.user_roles
  FOR SELECT USING (
    context_patient_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) OR
    context_patient_id IN (
      SELECT patient_profile_id FROM public.collaborations 
      WHERE collaborator_profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      ) AND is_active = true
    )
  );

-- RLS Policies for collaborations
CREATE POLICY "Users can view their collaborations" ON public.collaborations
  FOR SELECT USING (
    patient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    collaborator_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for invitations
CREATE POLICY "Users can view their invitations" ON public.invitations
  FOR SELECT USING (
    patient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    collaborator_code IN (SELECT codigo FROM public.profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their subscriptions" ON public.subscriptions
  FOR SELECT USING (
    patient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    patient_profile_id IN (
      SELECT patient_profile_id FROM public.collaborations 
      WHERE collaborator_profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      ) AND is_active = true
    )
  );

-- Function to generate unique codes
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE codigo = new_code) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, codigo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    generate_unique_code()
  );
  RETURN new;
END;
$$;

-- Trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaborations_updated_at
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();