-- Create function to notify users mentioned in posts
CREATE OR REPLACE FUNCTION notify_post_mention()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_username TEXT;
  mentioned_user_id UUID;
  author_name TEXT;
  mention_pattern TEXT;
BEGIN
  -- Get author name
  SELECT full_name INTO author_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Find all @mentions in the content (pattern: @username)
  FOR mention_pattern IN 
    SELECT DISTINCT (regexp_matches(NEW.content, '@(\w+)', 'g'))[1]
  LOOP
    -- Find user with matching name (case insensitive partial match)
    SELECT id INTO mentioned_user_id
    FROM profiles
    WHERE LOWER(full_name) LIKE '%' || LOWER(mention_pattern) || '%'
    AND id != NEW.author_id
    LIMIT 1;
    
    IF mentioned_user_id IS NOT NULL THEN
      -- Create notification for mentioned user
      INSERT INTO notifications (user_id, type, content, metadata)
      VALUES (
        mentioned_user_id,
        'mention',
        COALESCE(author_name, 'Someone') || ' mentioned you in a post',
        jsonb_build_object(
          'post_id', NEW.id,
          'author_id', NEW.author_id
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for post mentions
DROP TRIGGER IF EXISTS notify_post_mention_trigger ON posts;
CREATE TRIGGER notify_post_mention_trigger
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_mention();

-- Also create function to notify mentions in comments
CREATE OR REPLACE FUNCTION notify_comment_mention()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id UUID;
  author_name TEXT;
  mention_pattern TEXT;
  post_id_val UUID;
BEGIN
  -- Get author name
  SELECT full_name INTO author_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  post_id_val := NEW.post_id;
  
  -- Find all @mentions in the content
  FOR mention_pattern IN 
    SELECT DISTINCT (regexp_matches(NEW.content, '@(\w+)', 'g'))[1]
  LOOP
    -- Find user with matching name
    SELECT id INTO mentioned_user_id
    FROM profiles
    WHERE LOWER(full_name) LIKE '%' || LOWER(mention_pattern) || '%'
    AND id != NEW.author_id
    LIMIT 1;
    
    IF mentioned_user_id IS NOT NULL THEN
      -- Create notification for mentioned user
      INSERT INTO notifications (user_id, type, content, metadata)
      VALUES (
        mentioned_user_id,
        'mention',
        COALESCE(author_name, 'Someone') || ' mentioned you in a comment',
        jsonb_build_object(
          'post_id', post_id_val,
          'comment_id', NEW.id,
          'author_id', NEW.author_id
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for comment mentions
DROP TRIGGER IF EXISTS notify_comment_mention_trigger ON post_comments;
CREATE TRIGGER notify_comment_mention_trigger
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_mention();