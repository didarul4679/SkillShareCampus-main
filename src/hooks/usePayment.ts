import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PaymentMethod = "sslcommerz" | "bkash" | "nagad" | "card" | "bank";

interface InitiatePaymentParams {
  courseId: string;
  courseTitle: string;
  amount: number;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  discountAmount?: number;
  finalAmount: number;
}

interface PaymentResponse {
  success: boolean;
  mode: "sandbox" | "sandbox_mock" | "live";
  payment_url: string;
  transaction_id?: string;
  message?: string;
  session_key?: string;
}

interface CouponValidation {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount: number | null;
    description: string;
  };
  discount_amount?: number;
  error?: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  transaction_id: string | null;
  status: string;
  coupon_code: string | null;
  created_at: string;
  completed_at: string | null;
  course?: {
    title: string;
    thumbnail_url: string | null;
  };
}

// Hook to validate coupon
export function useValidateCoupon() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ code, courseId, amount }: { code: string; courseId: string; amount: number }): Promise<CouponValidation> => {
      if (!user) throw new Error("Not authenticated");

      // Check if coupon exists and is valid
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!coupon) return { valid: false, error: "Invalid coupon code" };

      // Check expiry
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        return { valid: false, error: "Coupon has expired" };
      }

      // Check if not yet valid
      if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
        return { valid: false, error: "Coupon is not yet active" };
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return { valid: false, error: "Coupon usage limit reached" };
      }

      // Check if applicable to this course
      if (coupon.course_id && coupon.course_id !== courseId) {
        return { valid: false, error: "Coupon not applicable to this course" };
      }

      // Check minimum purchase
      if (coupon.min_purchase && amount < Number(coupon.min_purchase)) {
        return { valid: false, error: `Minimum purchase of ৳${coupon.min_purchase} required` };
      }

      // Check if user already used this coupon
      const { data: usage } = await supabase
        .from("coupon_usage")
        .select("id")
        .eq("coupon_id", coupon.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (usage) {
        return { valid: false, error: "You have already used this coupon" };
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = (amount * Number(coupon.discount_value)) / 100;
        if (coupon.max_discount) {
          discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
        }
      } else {
        discountAmount = Number(coupon.discount_value);
      }

      return {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount_type: coupon.discount_type as "percentage" | "fixed",
          discount_value: Number(coupon.discount_value),
          max_discount: coupon.max_discount ? Number(coupon.max_discount) : null,
          description: coupon.description || "",
        },
        discount_amount: discountAmount,
      };
    },
  });
}

// Hook to initiate payment
export function useInitiatePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: InitiatePaymentParams): Promise<PaymentResponse> => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("sslcommerz-payment", {
        body: {
          course_id: params.courseId,
          course_title: params.courseTitle,
          amount: params.amount,
          final_amount: params.finalAmount,
          discount_amount: params.discountAmount || 0,
          coupon_code: params.couponCode,
          payment_method: params.paymentMethod,
          user_id: user.id,
          user_email: user.email || "user@example.com",
          user_name: user.user_metadata?.full_name || "Student",
        },
      });

      if (error) throw error;
      return data as PaymentResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payment-transactions"] });
      if (data.mode === "sandbox_mock") {
        toast.info("Opening test payment page...");
        // Open without noopener to allow window.opener communication
        const paymentWindow = window.open(data.payment_url, "_blank");
        if (!paymentWindow) {
          // Fallback if popup blocked
          window.location.href = data.payment_url;
        }
      } else {
        toast.info("Redirecting to payment gateway...");
        // For real payment gateway, redirect in same window
        window.location.href = data.payment_url;
      }
    },
    onError: (error) => {
      console.error("Payment initiation error:", error);
      toast.error("Failed to initiate payment: " + error.message);
    },
  });
}

// Hook to get payment history
export function usePaymentHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payment-transactions", user?.id],
    queryFn: async (): Promise<PaymentTransaction[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          *,
          course:courses(title, thumbnail_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentTransaction[];
    },
    enabled: !!user,
  });
}

// Hook to get single transaction
export function usePaymentTransaction(transactionId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payment-transaction", transactionId],
    queryFn: async () => {
      if (!transactionId || !user) return null;

      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          *,
          course:courses(title, thumbnail_url, instructor)
        `)
        .eq("id", transactionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!transactionId && !!user,
  });
}
