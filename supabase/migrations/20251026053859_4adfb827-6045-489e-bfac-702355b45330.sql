-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_content TEXT,
  p_related_user_id UUID DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, content)
  VALUES (p_user_id, p_type, p_content);
END;
$$;

-- Trigger: When someone sends a friend request
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Create notification for the recipient
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, content)
    VALUES (
      NEW.friend_id,
      'friend_request',
      COALESCE(sender_name, 'Someone') || ' sent you a friend request'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friend_request_notification ON friendships;
CREATE TRIGGER friend_request_notification
  AFTER INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();

-- Trigger: When friend request is accepted
CREATE OR REPLACE FUNCTION notify_friend_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepter_name TEXT;
BEGIN
  -- Get accepter's name
  SELECT full_name INTO accepter_name
  FROM profiles
  WHERE id = NEW.friend_id;

  -- Notify the original requester
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, type, content)
    VALUES (
      NEW.user_id,
      'friend_accepted',
      COALESCE(accepter_name, 'Someone') || ' accepted your friend request'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friend_accepted_notification ON friendships;
CREATE TRIGGER friend_accepted_notification
  AFTER UPDATE ON friendships
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
  EXECUTE FUNCTION notify_friend_accepted();

-- Trigger: When someone sends a message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Create notification for the receiver
  INSERT INTO notifications (user_id, type, content)
  VALUES (
    NEW.receiver_id,
    'new_message',
    COALESCE(sender_name, 'Someone') || ' sent you a message'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS new_message_notification ON messages;
CREATE TRIGGER new_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Trigger: When someone likes a post
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author UUID;
  liker_name TEXT;
BEGIN
  -- This is a simplified version - in production you'd have a likes table
  -- For now, we'll skip this as we don't have a proper likes table
  RETURN NEW;
END;
$$;

-- Add metadata column to notifications for storing additional data
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;