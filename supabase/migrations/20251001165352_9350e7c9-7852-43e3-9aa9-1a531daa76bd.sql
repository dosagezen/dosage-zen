-- Fix security definer view issue by removing the view
-- We'll rely on the secure lookup function instead
DROP VIEW IF EXISTS public.public_profiles;

-- Remove the problematic RLS policy that was trying to use request headers
DROP POLICY IF EXISTS "Users can lookup profiles by code for invitations" ON public.profiles;

-- The existing RLS policies on profiles are already secure:
-- 1. Users can only SELECT/UPDATE their own profile
-- 2. Admins can view all profiles
-- 3. The lookup_profile_by_code() function provides secure limited access

-- Add a helper function for collaborators to see basic info of users they collaborate with
CREATE OR REPLACE FUNCTION public.get_collaborator_basic_info(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  sobrenome text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nome,
    p.sobrenome,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = p_profile_id
    AND (
      -- Allow if requesting user is in an active collaboration with this profile
      EXISTS (
        SELECT 1 FROM public.collaborations c
        WHERE (
          (c.patient_profile_id = p_profile_id AND c.collaborator_profile_id = get_user_profile_id(auth.uid()))
          OR
          (c.collaborator_profile_id = p_profile_id AND c.patient_profile_id = get_user_profile_id(auth.uid()))
        )
        AND c.is_active = true
      )
      -- Or if it's their own profile
      OR p.user_id = auth.uid()
      -- Or if they're an admin
      OR is_admin(auth.uid())
    );
$$;

-- Document the secure access pattern
COMMENT ON FUNCTION public.lookup_profile_by_code IS 
'Securely lookup basic profile info by code for invitation system. Only returns non-sensitive fields (nome, sobrenome, codigo). Does not expose PII like email, celular, or data_nascimento.';

COMMENT ON FUNCTION public.get_collaborator_basic_info IS 
'Get basic profile info for users you collaborate with. Only returns non-sensitive fields and only works if you have an active collaboration with the user.';

-- Ensure the audit trigger is properly set up for monitoring
-- (already created in previous migration, just adding documentation)
COMMENT ON FUNCTION public.audit_profile_sensitive_changes IS 
'Audit trail for changes to sensitive profile fields (email, celular, data_nascimento). Logs all modifications to audit_logs table for security monitoring.';