-- Create post_likes table to track who liked which posts
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view post likes"
  ON public.post_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- Function to update post likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to automatically update likes_count
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- Update notify_post_like function to work with post_likes table
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author UUID;
  liker_name TEXT;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's name
  SELECT full_name INTO liker_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification for the post author
  INSERT INTO notifications (user_id, type, content, metadata)
  VALUES (
    post_author,
    'post_like',
    COALESCE(liker_name, 'Someone') || ' liked your post',
    jsonb_build_object(
      'post_id', NEW.post_id,
      'liker_id', NEW.user_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to send notification when someone likes a post
CREATE TRIGGER notify_post_like_trigger
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_like();

-- Enable realtime for post_likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;