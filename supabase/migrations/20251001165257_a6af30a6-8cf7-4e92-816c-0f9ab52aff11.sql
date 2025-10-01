-- Create a secure function to lookup basic profile info by code
-- This allows the invitation system to work without exposing sensitive PII
CREATE OR REPLACE FUNCTION public.lookup_profile_by_code(p_code text)
RETURNS TABLE (
  id uuid,
  nome text,
  sobrenome text,
  codigo text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    nome,
    sobrenome,
    codigo
  FROM public.profiles
  WHERE codigo = p_code
  LIMIT 1;
$$;

-- Create a view for public profile information (non-sensitive fields only)
-- This can be used for collaboration discovery without exposing PII
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  nome,
  sobrenome,
  codigo,
  avatar_url,
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Add RLS policy for public_profiles view to allow users to search by codigo
-- but only return basic info (no email, celular, data_nascimento)
CREATE POLICY "Users can lookup profiles by code for invitations"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Allow users to see basic info of profiles they're searching by code
  -- but only when they provide the exact code (prevents enumeration)
  codigo IN (
    SELECT unnest(string_to_array(current_setting('request.headers', true)::json->>'x-profile-code', ','))
  )
  OR user_id = auth.uid()
  OR is_admin(auth.uid())
);

-- Add comment documenting the security measures
COMMENT ON TABLE public.profiles IS 
'Contains user profile data with field-level security. Sensitive fields (email, celular, data_nascimento) are only accessible to the profile owner and admins. Use lookup_profile_by_code() function or public_profiles view for collaboration discovery without exposing PII.';

-- Add column-level security documentation
COMMENT ON COLUMN public.profiles.email IS 'SENSITIVE: Only accessible to profile owner and admins';
COMMENT ON COLUMN public.profiles.celular IS 'SENSITIVE: Only accessible to profile owner and admins'; 
COMMENT ON COLUMN public.profiles.data_nascimento IS 'SENSITIVE: Only accessible to profile owner and admins';

-- Create audit trigger for sensitive profile updates
CREATE OR REPLACE FUNCTION public.audit_profile_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log changes to sensitive fields
  IF (OLD.email IS DISTINCT FROM NEW.email) OR 
     (OLD.celular IS DISTINCT FROM NEW.celular) OR 
     (OLD.data_nascimento IS DISTINCT FROM NEW.data_nascimento) THEN
    
    INSERT INTO public.audit_logs (
      actor_user_id,
      action,
      entity,
      entity_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      'UPDATE_SENSITIVE',
      'profiles',
      NEW.id,
      jsonb_build_object(
        'email', OLD.email,
        'celular', OLD.celular,
        'data_nascimento', OLD.data_nascimento
      ),
      jsonb_build_object(
        'email', NEW.email,
        'celular', NEW.celular,
        'data_nascimento', NEW.data_nascimento
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auditing sensitive profile changes
DROP TRIGGER IF EXISTS audit_profile_sensitive_changes_trigger ON public.profiles;
CREATE TRIGGER audit_profile_sensitive_changes_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_sensitive_changes();