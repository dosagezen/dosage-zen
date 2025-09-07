
-- Insert admin role for your user
INSERT INTO public.user_roles (user_id, role)
VALUES ('e14240c6-af12-4415-aaf6-67f7ea8370fb', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
