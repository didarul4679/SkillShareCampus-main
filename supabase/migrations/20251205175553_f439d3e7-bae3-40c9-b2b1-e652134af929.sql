-- Allow authenticated users to create courses (as instructors)
CREATE POLICY "Users can create courses"
  ON public.courses
  FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);

-- Allow instructors to update their own courses
CREATE POLICY "Instructors can update own courses"
  ON public.courses
  FOR UPDATE
  USING (auth.uid() = instructor_id);

-- Allow instructors to delete their own courses
CREATE POLICY "Instructors can delete own courses"
  ON public.courses
  FOR DELETE
  USING (auth.uid() = instructor_id);