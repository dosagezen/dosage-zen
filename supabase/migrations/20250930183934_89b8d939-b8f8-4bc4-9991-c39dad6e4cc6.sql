-- ====================================================================
-- MIGRAÇÃO: Corrigir inicialização completa de novos usuários
-- ====================================================================

-- 1. Atualizar função handle_new_user para ativar is_gestor automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Criar perfil com is_gestor = true por padrão
  INSERT INTO public.profiles (user_id, email, nome, sobrenome, codigo, is_gestor)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data ->> 'sobrenome', ''),
    generate_unique_code(),
    true  -- Ativar gestor automaticamente
  );
  RETURN new;
END;
$$;

-- 2. Criar função para inicializar papel de usuário automaticamente
CREATE OR REPLACE FUNCTION public.initialize_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Criar papel de paciente automaticamente quando perfil é criado
  INSERT INTO public.user_roles (
    user_id,
    profile_id,
    role,
    context_patient_id,
    is_active
  ) VALUES (
    NEW.user_id,
    NEW.id,
    'paciente',
    NEW.id,  -- context_patient_id é o próprio perfil para pacientes
    true
  );
  
  RAISE LOG 'Papel de paciente criado automaticamente para perfil %', NEW.id;
  RETURN NEW;
END;
$$;

-- 3. Criar trigger para inicializar papel automaticamente após criação de perfil
DROP TRIGGER IF EXISTS on_profile_created_init_role ON public.profiles;
CREATE TRIGGER on_profile_created_init_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.initialize_user_role();

-- 4. Corrigir usuários existentes sem papéis
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Ativar is_gestor para todos os perfis existentes
  UPDATE public.profiles
  SET is_gestor = true
  WHERE is_gestor = false OR is_gestor IS NULL;

  -- Criar papéis para perfis sem papel de paciente
  FOR profile_record IN 
    SELECT p.id, p.user_id
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.profile_id = p.id AND ur.role = 'paciente'
    )
  LOOP
    INSERT INTO public.user_roles (
      user_id,
      profile_id,
      role,
      context_patient_id,
      is_active
    ) VALUES (
      profile_record.user_id,
      profile_record.id,
      'paciente',
      profile_record.id,
      true
    )
    ON CONFLICT (user_id, role) DO UPDATE SET
      is_active = true,
      context_patient_id = profile_record.id,
      updated_at = now();
    
    RAISE LOG 'Papel de paciente criado/atualizado para perfil existente %', profile_record.id;
  END LOOP;
END $$;