-- Add image_url column to posts table
ALTER TABLE public.posts 
ADD COLUMN image_url TEXT;

-- Create post-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Create RLS policies for post-images bucket
CREATE POLICY "Post images are viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Users can upload post images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own post images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);