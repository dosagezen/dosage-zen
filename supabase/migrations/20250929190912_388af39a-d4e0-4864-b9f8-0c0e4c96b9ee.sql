-- Adicionar coluna sobrenome na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sobrenome TEXT;

-- Remover a função antiga
DROP FUNCTION IF EXISTS fn_profile_update(TEXT, TEXT, TEXT, TEXT, BOOLEAN, DATE);

-- Criar a nova função fn_profile_update com sobrenome
CREATE OR REPLACE FUNCTION fn_profile_update(
  p_nome TEXT DEFAULT NULL,
  p_sobrenome TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_celular TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_is_gestor BOOLEAN DEFAULT NULL,
  p_data_nascimento DATE DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles;
  v_profile_id uuid;
  v_user_id uuid;
BEGIN
  -- Obter o user_id do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Obter o profile_id do usuário autenticado
  SELECT id INTO v_profile_id 
  FROM profiles 
  WHERE user_id = v_user_id;
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
  
  -- Validações de entrada
  IF p_email IS NOT NULL AND p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;
  
  IF p_nome IS NOT NULL AND length(trim(p_nome)) = 0 THEN
    RAISE EXCEPTION 'Nome não pode ser vazio';
  END IF;
  
  IF p_sobrenome IS NOT NULL AND length(trim(p_sobrenome)) = 0 THEN
    RAISE EXCEPTION 'Sobrenome não pode ser vazio';
  END IF;
  
  -- Atualizar apenas campos não nulos fornecidos
  UPDATE profiles
  SET
    nome = COALESCE(p_nome, nome),
    sobrenome = COALESCE(p_sobrenome, sobrenome),
    email = COALESCE(p_email, email),
    celular = COALESCE(p_celular, celular),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    is_gestor = COALESCE(p_is_gestor, is_gestor),
    data_nascimento = COALESCE(p_data_nascimento, data_nascimento),
    updated_at = now()
  WHERE id = v_profile_id
  RETURNING * INTO v_profile;
  
  RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION fn_profile_update IS 'Atualiza o perfil do usuário autenticado com validações (incluindo sobrenome)';