-- Create rate_limits table for spam prevention
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  action_count INTEGER DEFAULT 0 NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, action_type)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only system can modify rate limits (will be done via edge functions)
CREATE POLICY "System can manage rate limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_actions INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current rate limit record
  SELECT action_count, window_start
  INTO v_current_count, v_window_start
  FROM public.rate_limits
  WHERE user_id = p_user_id 
    AND action_type = p_action_type;
  
  -- If no record exists or window expired, create/reset it
  IF NOT FOUND OR (NOW() - v_window_start) > (p_window_minutes || ' minutes')::INTERVAL THEN
    INSERT INTO public.rate_limits (user_id, action_type, action_count, window_start)
    VALUES (p_user_id, p_action_type, 1, NOW())
    ON CONFLICT (user_id, action_type) 
    DO UPDATE SET 
      action_count = 1,
      window_start = NOW(),
      updated_at = NOW();
    RETURN TRUE;
  END IF;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_actions THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  UPDATE public.rate_limits
  SET action_count = action_count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id 
    AND action_type = p_action_type;
  
  RETURN TRUE;
END;
$$;

-- Function to get remaining actions
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_actions INTEGER,
  p_window_minutes INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_time_remaining INTEGER;
BEGIN
  SELECT action_count, window_start
  INTO v_current_count, v_window_start
  FROM public.rate_limits
  WHERE user_id = p_user_id 
    AND action_type = p_action_type;
  
  -- If no record or window expired
  IF NOT FOUND OR (NOW() - v_window_start) > (p_window_minutes || ' minutes')::INTERVAL THEN
    RETURN json_build_object(
      'remaining', p_max_actions,
      'total', p_max_actions,
      'reset_in_seconds', 0,
      'limited', false
    );
  END IF;
  
  v_time_remaining := EXTRACT(EPOCH FROM (v_window_start + (p_window_minutes || ' minutes')::INTERVAL - NOW()))::INTEGER;
  
  RETURN json_build_object(
    'remaining', GREATEST(0, p_max_actions - v_current_count),
    'total', p_max_actions,
    'reset_in_seconds', GREATEST(0, v_time_remaining),
    'limited', v_current_count >= p_max_actions
  );
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();