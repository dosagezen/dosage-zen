-- ====================================================================
-- MIGRAÇÃO: Corrigir captura de celular no signup
-- ====================================================================

-- 1. Atualizar função handle_new_user para incluir celular
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Criar perfil com is_gestor = true e celular do signup
  INSERT INTO public.profiles (user_id, email, nome, sobrenome, celular, codigo, is_gestor)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data ->> 'sobrenome', ''),
    new.raw_user_meta_data ->> 'celular',  -- Capturar celular do signup
    generate_unique_code(),
    true
  );
  RETURN new;
END;
$$;

-- 2. Corrigir usuários existentes: copiar celular de raw_user_meta_data se disponível
DO $$
DECLARE
  user_record RECORD;
  celular_value TEXT;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.raw_user_meta_data, p.id as profile_id, p.celular
    FROM auth.users u
    JOIN public.profiles p ON p.user_id = u.id
    WHERE p.celular IS NULL OR p.celular = ''
  LOOP
    -- Extrair celular dos metadados
    celular_value := user_record.raw_user_meta_data ->> 'celular';
    
    -- Atualizar apenas se houver valor
    IF celular_value IS NOT NULL AND celular_value != '' THEN
      UPDATE public.profiles
      SET celular = celular_value,
          updated_at = now()
      WHERE id = user_record.profile_id;
      
      RAISE LOG 'Celular atualizado para perfil %: %', user_record.profile_id, celular_value;
    END IF;
  END LOOP;
END $$;