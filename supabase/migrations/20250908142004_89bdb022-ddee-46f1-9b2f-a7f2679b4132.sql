-- Recreate the generate_unique_code function properly
CREATE OR REPLACE FUNCTION public.generate_unique_code()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE codigo = new_code) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN new_code;
END;
$$;