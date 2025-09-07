-- Create function to handle admin user creation after invite acceptance
CREATE OR REPLACE FUNCTION public.handle_admin_invite_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user has admin role in their metadata
  IF NEW.raw_user_meta_data ->> 'role' = 'admin' THEN
    -- Get profile ID for the user
    DECLARE
      profile_id_var UUID;
    BEGIN
      SELECT id INTO profile_id_var 
      FROM public.profiles 
      WHERE user_id = NEW.id;
      
      -- If profile exists, create admin role
      IF profile_id_var IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, profile_id, role, is_active)
        VALUES (NEW.id, profile_id_var, 'admin', true)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE LOG 'Admin role created for user %', NEW.id;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user email is confirmed (invite accepted)
CREATE OR REPLACE TRIGGER on_admin_invite_accepted
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_admin_invite_acceptance();