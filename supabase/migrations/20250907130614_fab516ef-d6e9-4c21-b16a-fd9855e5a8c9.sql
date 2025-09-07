-- Remove políticas que causam recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert new admin user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update admin user roles" ON public.user_roles;

-- Cria função security definer para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = user_uuid
      AND ur.role = 'admin'
      AND ur.is_active = true
  );
$$;

-- Recria políticas usando a função security definer
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage admin user roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (role = 'admin' AND public.is_admin(auth.uid()))
  WITH CHECK (role = 'admin' AND public.is_admin(auth.uid()));