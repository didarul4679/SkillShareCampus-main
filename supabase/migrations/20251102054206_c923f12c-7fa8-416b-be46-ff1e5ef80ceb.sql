-- Create banned_users table for user bans
CREATE TABLE IF NOT EXISTS public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  banned_at timestamptz NOT NULL DEFAULT now(),
  banned_until timestamptz,
  is_permanent boolean NOT NULL DEFAULT false,
  UNIQUE(user_id)
);

-- Create user_warnings table for warnings and suspensions
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by uuid NOT NULL REFERENCES auth.users(id),
  warning_type text NOT NULL CHECK (warning_type IN ('warning', 'suspension', 'notice')),
  reason text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create post_reports table for flagged content
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  target_post_id uuid REFERENCES public.posts(id),
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banned_users
CREATE POLICY "Admins can view all bans"
  ON public.banned_users FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage bans"
  ON public.banned_users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_warnings
CREATE POLICY "Staff can view all warnings"
  ON public.user_warnings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Staff can issue warnings"
  ON public.user_warnings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- RLS Policies for post_reports
CREATE POLICY "Users can create reports"
  ON public.post_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own reports"
  ON public.post_reports FOR SELECT
  USING (auth.uid() = reported_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Staff can update reports"
  ON public.post_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Create indexes for performance
CREATE INDEX idx_banned_users_user_id ON public.banned_users(user_id);
CREATE INDEX idx_user_warnings_user_id ON public.user_warnings(user_id);
CREATE INDEX idx_post_reports_status ON public.post_reports(status);
CREATE INDEX idx_post_reports_post_id ON public.post_reports(post_id);
CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action_type text,
  p_target_user_id uuid DEFAULT NULL,
  p_target_post_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (admin_id, action_type, target_user_id, target_post_id, details)
  VALUES (auth.uid(), p_action_type, p_target_user_id, p_target_post_id, p_details);
END;
$$;

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_users
    WHERE user_id = p_user_id
      AND (is_permanent = true OR banned_until > now())
  );
$$;