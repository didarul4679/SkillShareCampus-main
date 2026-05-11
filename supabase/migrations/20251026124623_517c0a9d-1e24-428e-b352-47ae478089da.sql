-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Comments are viewable by everyone"
ON public.post_comments
FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.post_comments
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments
FOR DELETE
USING (auth.uid() = author_id);

-- Trigger to update posts.comments_count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger to send notification when someone comments
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author UUID;
  commenter_name TEXT;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_author = NEW.author_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's name
  SELECT full_name INTO commenter_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Create notification for the post author
  INSERT INTO notifications (user_id, type, content, metadata)
  VALUES (
    post_author,
    'post_comment',
    COALESCE(commenter_name, 'Someone') || ' commented on your post',
    jsonb_build_object(
      'post_id', NEW.post_id,
      'comment_id', NEW.id,
      'commenter_id', NEW.author_id
    )
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_post_comment_trigger
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_comment();

-- Trigger for updated_at
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();