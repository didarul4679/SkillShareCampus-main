-- Add last_seen_at column to profiles table
ALTER TABLE profiles ADD COLUMN last_seen_at timestamp with time zone DEFAULT now();

-- Create index for better query performance
CREATE INDEX idx_profiles_last_seen_at ON profiles(last_seen_at);