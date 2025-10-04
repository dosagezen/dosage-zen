-- Create public storage bucket for report snapshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-reports',
  'public-reports',
  true,
  5242880, -- 5MB limit
  ARRAY['text/html']
);

-- Allow public read access to reports
CREATE POLICY "Public reports are viewable by anyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-reports');

-- Allow authenticated users to upload their reports
CREATE POLICY "Users can upload their own reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-reports' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their reports (for regeneration)
CREATE POLICY "Users can update their own reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public-reports' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their reports
CREATE POLICY "Users can delete their own reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public-reports' 
  AND auth.uid() IS NOT NULL
);