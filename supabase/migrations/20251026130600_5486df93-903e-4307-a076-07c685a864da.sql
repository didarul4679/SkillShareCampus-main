-- Add shared_count column to posts table
ALTER TABLE posts ADD COLUMN shared_count integer NOT NULL DEFAULT 0;

-- Create post_shares table to track shares
CREATE TABLE post_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  shared_via text, -- 'repost', 'message', 'link'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, shared_via)
);

-- Enable RLS
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_shares
CREATE POLICY "Anyone can view shares"
ON post_shares
FOR SELECT
USING (true);

CREATE POLICY "Users can share posts"
ON post_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
ON post_shares
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update shared_count
CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET shared_count = shared_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET shared_count = GREATEST(0, shared_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for shared_count
CREATE TRIGGER update_shares_count_trigger
AFTER INSERT OR DELETE ON post_shares
FOR EACH ROW
EXECUTE FUNCTION update_post_shares_count();

-- Create index for better performance
CREATE INDEX idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX idx_post_shares_user_id ON post_shares(user_id);