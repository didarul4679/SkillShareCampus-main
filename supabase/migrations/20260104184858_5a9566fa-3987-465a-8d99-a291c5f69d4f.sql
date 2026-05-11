-- Create campus_news table
CREATE TABLE public.campus_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.campus_news ENABLE ROW LEVEL SECURITY;

-- Everyone can read published news
CREATE POLICY "Anyone can read published news"
ON public.campus_news
FOR SELECT
USING (is_published = true);

-- Admins can manage news
CREATE POLICY "Admins can insert news"
ON public.campus_news
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update news"
ON public.campus_news
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete news"
ON public.campus_news
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_campus_news_updated_at
BEFORE UPDATE ON public.campus_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.campus_news (title, content, published_at) VALUES
('Appoint new VC', 'The university has appointed a new Vice Chancellor.', now() - interval '12 days'),
('Appoint new Department Head of CSE', 'New head of Computer Science department announced.', now() - interval '15 days'),
('5 days Micro-scientist Courses', 'Short courses on micro-science starting next week.', now() - interval '15 days');