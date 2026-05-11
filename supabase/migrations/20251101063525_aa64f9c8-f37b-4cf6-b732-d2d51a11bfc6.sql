-- Add reaction_type column to post_likes table
ALTER TABLE post_likes ADD COLUMN reaction_type text NOT NULL DEFAULT 'like';

-- Add check constraint for valid reaction types
ALTER TABLE post_likes ADD CONSTRAINT valid_reaction_type 
CHECK (reaction_type IN ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

-- Update unique constraint to allow one reaction per user per post
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_user_id_key;
ALTER TABLE post_likes ADD CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id);

-- Create index for reaction type queries
CREATE INDEX IF NOT EXISTS idx_post_likes_reaction_type ON post_likes(reaction_type);