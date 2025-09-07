-- Fix the unique constraint issue in user_roles table
-- Add proper unique constraint that the trigger expects
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);

-- Update the handle_admin_invite_acceptance trigger to handle conflicts properly
CREATE OR REPLACE FUNCTION public.handle_admin_invite_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        ON CONFLICT (user_id, role) DO UPDATE SET
          is_active = true,
          updated_at = now();
        
        RAISE LOG 'Admin role created/updated for user %', NEW.id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error creating admin role for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;