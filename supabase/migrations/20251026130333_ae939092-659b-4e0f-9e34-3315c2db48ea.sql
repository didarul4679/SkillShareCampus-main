-- Create message-attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Add attachment columns to messages table
ALTER TABLE messages 
ADD COLUMN attachment_url text,
ADD COLUMN attachment_type text;

-- RLS policies for message-attachments bucket
CREATE POLICY "Users can upload attachments for their messages"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view attachments in their conversations"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'message-attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    auth.uid()::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'message-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);