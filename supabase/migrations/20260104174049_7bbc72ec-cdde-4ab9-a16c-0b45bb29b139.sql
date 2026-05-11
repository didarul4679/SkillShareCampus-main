-- Create function to notify users when they receive a message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification for receiver
  INSERT INTO notifications (user_id, type, content, metadata)
  VALUES (
    NEW.receiver_id,
    'message',
    COALESCE(sender_name, 'Someone') || ' sent you a message',
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'message_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS notify_new_message_trigger ON messages;
CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();