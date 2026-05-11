-- Add edited_at column to posts table
ALTER TABLE public.posts 
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN public.posts.edited_at IS 'Timestamp when the post was last edited. NULL if never edited.';