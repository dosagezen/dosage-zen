-- Fix function search path for all functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Fix handle_new_user function search path
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

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_profile_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_collaborations(user_uuid UUID)
RETURNS TABLE(patient_profile_id UUID, collaborator_profile_id UUID) AS $$
  SELECT c.patient_profile_id, c.collaborator_profile_id 
  FROM public.collaborations c
  JOIN public.profiles p ON (c.patient_profile_id = p.id OR c.collaborator_profile_id = p.id)
  WHERE p.user_id = user_uuid AND c.is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;