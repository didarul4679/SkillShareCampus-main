-- Fix message attachments: store object path in messages.attachment_url and add secure storage policies

-- 1) Convert existing attachment URLs (public or signed) into storage object paths
UPDATE public.messages
SET attachment_url = regexp_replace(
  attachment_url,
  '^https?://[^/]+/storage/v1/object/public/message-attachments/',
  ''
)
WHERE attachment_url IS NOT NULL
  AND attachment_url ~* '/storage/v1/object/public/message-attachments/';

UPDATE public.messages
SET attachment_url = split_part(
  regexp_replace(
    attachment_url,
    '^https?://[^/]+/storage/v1/object/sign/message-attachments/',
    ''
  ),
  '?',
  1
)
WHERE attachment_url IS NOT NULL
  AND attachment_url ~* '/storage/v1/object/sign/message-attachments/';

-- 2) Storage policies for private bucket access
-- Ensure only chat participants can read attachments, and only sender can upload/delete their own

DROP POLICY IF EXISTS message_attachments_read_participants ON storage.objects;
DROP POLICY IF EXISTS message_attachments_insert_sender ON storage.objects;
DROP POLICY IF EXISTS message_attachments_delete_sender ON storage.objects;

CREATE POLICY message_attachments_read_participants
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE m.attachment_url = storage.objects.name
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

CREATE POLICY message_attachments_insert_sender
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY message_attachments_delete_sender
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
