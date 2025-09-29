-- Adicionar coluna data_nascimento à tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Comentário da coluna
COMMENT ON COLUMN profiles.data_nascimento IS 'Data de nascimento do usuário';

-- Criar/Atualizar função para trigger de updated_at (se ainda não existe)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Aplicar trigger na tabela profiles (se ainda não existe)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar função para proteger o campo codigo (imutável)
CREATE OR REPLACE FUNCTION prevent_codigo_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.codigo IS DISTINCT FROM NEW.codigo THEN
    RAISE EXCEPTION 'O código do usuário não pode ser alterado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger de proteção do codigo
DROP TRIGGER IF EXISTS prevent_codigo_change ON profiles;
CREATE TRIGGER prevent_codigo_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_codigo_update();

-- RPC para atualização segura do perfil
CREATE OR REPLACE FUNCTION fn_profile_update(
  p_nome TEXT DEFAULT NULL,
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
  
  -- Atualizar apenas campos não nulos fornecidos
  UPDATE profiles
  SET
    nome = COALESCE(p_nome, nome),
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

-- Comentário da função
COMMENT ON FUNCTION fn_profile_update IS 'Atualiza o perfil do usuário autenticado com validações';

-- RPC para atualizar o papel principal do usuário
CREATE OR REPLACE FUNCTION fn_update_user_main_role(
  p_new_role app_role
)
RETURNS user_roles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_role_record user_roles;
BEGIN
  -- Obter user_id
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Obter profile_id
  SELECT id INTO v_profile_id 
  FROM profiles 
  WHERE user_id = v_user_id;
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
  
  -- Validar se o papel é válido (não permite admin, pois admin é gerenciado separadamente)
  IF p_new_role NOT IN ('paciente', 'acompanhante', 'cuidador') THEN
    RAISE EXCEPTION 'Papel inválido. Permitidos: paciente, acompanhante, cuidador';
  END IF;
  
  -- Verificar se já existe um registro com este papel
  SELECT * INTO v_role_record
  FROM user_roles
  WHERE user_id = v_user_id
    AND role = p_new_role
    AND is_active = true;
  
  -- Se já existe, retornar o registro existente
  IF FOUND THEN
    RETURN v_role_record;
  END IF;
  
  -- Desativar todos os papéis anteriores do usuário (exceto admin)
  UPDATE user_roles
  SET is_active = false,
      updated_at = now()
  WHERE user_id = v_user_id
    AND role != 'admin';
  
  -- Inserir ou reativar o novo papel
  INSERT INTO user_roles (
    user_id,
    profile_id,
    role,
    context_patient_id,
    is_active
  ) VALUES (
    v_user_id,
    v_profile_id,
    p_new_role,
    CASE WHEN p_new_role = 'paciente' THEN v_profile_id ELSE NULL END,
    true
  )
  ON CONFLICT (user_id, role) 
  DO UPDATE SET
    is_active = true,
    updated_at = now()
  RETURNING * INTO v_role_record;
  
  RETURN v_role_record;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION fn_update_user_main_role IS 'Atualiza o papel principal do usuário autenticado';