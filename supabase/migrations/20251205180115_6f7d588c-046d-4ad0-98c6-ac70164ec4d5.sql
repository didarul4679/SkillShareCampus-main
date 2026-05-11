-- Drop existing course insert policy
DROP POLICY IF EXISTS "Users can create courses" ON public.courses;

-- Create new policy: Only admins can create courses
CREATE POLICY "Only admins can create courses"
  ON public.courses
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update the instructor update/delete policies to also allow admins
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can delete own courses" ON public.courses;

CREATE POLICY "Admins can update courses"
  ON public.courses
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
  ON public.courses
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add payment_status to enrollments for tracking paid courses
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'free';

-- Update enrollment policy to check payment for paid courses
-- Free courses: anyone can enroll
-- Paid courses: must have payment_status = 'paid'