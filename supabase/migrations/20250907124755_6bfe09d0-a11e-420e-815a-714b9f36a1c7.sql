INSERT INTO public.user_roles (user_id, profile_id, role, is_active)
VALUES (
  'e14240c6-af12-4415-aaf6-67f7ea8370fb',  -- seu user_id
  'c097b617-1954-4f9c-9ca5-fb6fbfb784a0',  -- seu profile_id  
  'admin',
  true
) ON CONFLICT (user_id, role) DO NOTHING;