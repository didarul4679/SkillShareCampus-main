-- Drop the restrictive policy that blocks all operations
DROP POLICY IF EXISTS "Only service role can manage roles" ON public.user_roles;

-- Create policies that allow admins to manage roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Keep the existing view policy for users to see their own roles
-- (already exists: "Users can view their own roles")