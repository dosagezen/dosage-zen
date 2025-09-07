-- Add email_confirmed field to user_roles table for better status tracking
ALTER TABLE public.user_roles 
ADD COLUMN email_confirmed boolean DEFAULT false;

-- Create function to update email confirmation when user confirms email
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update email_confirmed flag for admin roles when user confirms email
  UPDATE public.user_roles 
  SET email_confirmed = true,
      updated_at = now()
  WHERE user_id = NEW.id 
    AND role = 'admin';
  
  RETURN NEW;
END;
$$;

-- Create trigger to update email confirmation status
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();