-- Add shared_post_id column to posts table to support embedded reposts
ALTER TABLE public.posts 
ADD COLUMN shared_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_posts_shared_post_id ON public.posts(shared_post_id) WHERE shared_post_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.posts.shared_post_id IS 'Reference to the original post when this post is a repost/share';