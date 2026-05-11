-- Create covers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true);

-- RLS Policies for covers bucket
CREATE POLICY "Users can view all cover images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover image"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own cover image"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own cover image"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);