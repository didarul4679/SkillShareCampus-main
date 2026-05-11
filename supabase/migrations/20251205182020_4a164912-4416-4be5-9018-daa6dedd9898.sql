-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  amount numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  final_amount numeric NOT NULL,
  payment_method text NOT NULL, -- 'sslcommerz', 'bkash', 'nagad', 'card', 'bank'
  transaction_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  gateway_response jsonb,
  coupon_code text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Create coupons table
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
  discount_value numeric NOT NULL,
  min_purchase numeric DEFAULT 0,
  max_discount numeric,
  max_uses integer,
  used_count integer DEFAULT 0,
  course_id uuid REFERENCES public.courses(id), -- null means applicable to all courses
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create coupon usage table to track per-user usage
CREATE TABLE public.coupon_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  transaction_id uuid REFERENCES public.payment_transactions(id),
  used_at timestamp with time zone DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update transactions"
  ON public.payment_transactions FOR UPDATE
  USING (true);

-- RLS policies for coupons (public read for active coupons)
CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for coupon_usage
CREATE POLICY "Users can view their own coupon usage"
  ON public.coupon_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create coupon usage"
  ON public.coupon_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_course ON public.payment_transactions(course_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupon_usage_user ON public.coupon_usage(user_id);

-- Insert some sample coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, max_uses, valid_until) VALUES
  ('WELCOME50', 'Welcome discount - 50% off your first course', 'percentage', 50, 100, now() + interval '30 days'),
  ('FLAT100', 'Flat ৳100 off on any course', 'fixed', 100, 50, now() + interval '60 days'),
  ('LEARN25', '25% off on all courses', 'percentage', 25, null, now() + interval '90 days');