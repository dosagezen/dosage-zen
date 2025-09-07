-- Allow admins to invite new users and manage admin roles
CREATE POLICY "Admins can insert new admin user roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only admins can insert admin roles
    role = 'admin' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Admins can update admin user roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can update admin roles
    role = 'admin' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    role = 'admin' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.is_active = true
    )
  );

-- Allow admins to view and update user profiles for admin management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Admins can update user profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.is_active = true
    )
  );