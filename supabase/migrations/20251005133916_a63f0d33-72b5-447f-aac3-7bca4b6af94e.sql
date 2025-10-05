-- Update public-reports bucket to accept JSON and PDF files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['text/html', 'application/json', 'application/pdf']
WHERE id = 'public-reports';