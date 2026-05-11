-- Enhance courses table with additional fields
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS duration_hours integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS students_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating decimal(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create course_lessons table
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'text', 'quiz')),
  content_url text,
  content_text text,
  order_index integer NOT NULL DEFAULT 0,
  duration_minutes integer DEFAULT 0,
  is_free_preview boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhance enrollments table
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz DEFAULT now();

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create course_reviews table
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at timestamptz DEFAULT now(),
  certificate_number text UNIQUE NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Enable RLS on new tables
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_lessons
CREATE POLICY "Lessons are viewable by everyone" ON public.course_lessons FOR SELECT USING (true);
CREATE POLICY "Instructors can manage their course lessons" ON public.course_lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- RLS Policies for lesson_progress
CREATE POLICY "Users can view their own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for course_reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.course_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.course_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.course_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for certificates
CREATE POLICY "Users can view their own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON public.course_lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);

-- Function to update course rating when review is added/updated
CREATE OR REPLACE FUNCTION public.update_course_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.courses
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.course_reviews
    WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
  )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update course rating
DROP TRIGGER IF EXISTS update_course_rating_trigger ON public.course_reviews;
CREATE TRIGGER update_course_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.course_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_course_rating();

-- Function to update enrollment progress
CREATE OR REPLACE FUNCTION public.update_enrollment_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id uuid;
  v_total_lessons integer;
  v_completed_lessons integer;
  v_progress integer;
BEGIN
  -- Get course_id from lesson
  SELECT course_id INTO v_course_id
  FROM public.course_lessons
  WHERE id = NEW.lesson_id;
  
  -- Count total and completed lessons
  SELECT COUNT(*) INTO v_total_lessons
  FROM public.course_lessons
  WHERE course_id = v_course_id;
  
  SELECT COUNT(*) INTO v_completed_lessons
  FROM public.lesson_progress lp
  JOIN public.course_lessons cl ON cl.id = lp.lesson_id
  WHERE cl.course_id = v_course_id
    AND lp.user_id = NEW.user_id
    AND lp.is_completed = true;
  
  -- Calculate progress percentage
  IF v_total_lessons > 0 THEN
    v_progress := (v_completed_lessons * 100) / v_total_lessons;
  ELSE
    v_progress := 0;
  END IF;
  
  -- Update enrollment
  UPDATE public.enrollments
  SET 
    progress_percentage = v_progress,
    last_accessed_at = now(),
    completed_at = CASE WHEN v_progress = 100 THEN now() ELSE completed_at END
  WHERE user_id = NEW.user_id AND course_id = v_course_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update enrollment progress
DROP TRIGGER IF EXISTS update_enrollment_progress_trigger ON public.lesson_progress;
CREATE TRIGGER update_enrollment_progress_trigger
AFTER INSERT OR UPDATE ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.update_enrollment_progress();

-- Function to increment students_count on enrollment
CREATE OR REPLACE FUNCTION public.update_course_students_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses SET students_count = students_count + 1 WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses SET students_count = GREATEST(0, students_count - 1) WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for students count
DROP TRIGGER IF EXISTS update_course_students_count_trigger ON public.enrollments;
CREATE TRIGGER update_course_students_count_trigger
AFTER INSERT OR DELETE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_course_students_count();