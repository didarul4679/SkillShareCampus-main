-- Create a function to check if two users are friends
CREATE OR REPLACE FUNCTION public.are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.friendships 
    WHERE status = 'accepted'
      AND (
        (user_id = user1_id AND friend_id = user2_id)
        OR 
        (user_id = user2_id AND friend_id = user1_id)
      )
  );
$$;

-- Create a function to get post IDs visible to a user (friends' posts + own posts)
CREATE OR REPLACE FUNCTION public.get_visible_posts(for_user_id uuid)
RETURNS TABLE (post_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id as post_id
  FROM public.posts p
  WHERE 
    -- Own posts
    p.author_id = for_user_id
    OR
    -- Posts from accepted friends
    EXISTS (
      SELECT 1 
      FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.user_id = for_user_id AND f.friend_id = p.author_id)
          OR 
          (f.friend_id = for_user_id AND f.user_id = p.author_id)
        )
    )
  ORDER BY p.created_at DESC;
$$;