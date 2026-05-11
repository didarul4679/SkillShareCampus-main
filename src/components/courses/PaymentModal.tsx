import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useValidateCoupon, useInitiatePayment, PaymentMethod } from "@/hooks/usePayment";
import { toast } from "sonner";
import {
  CreditCard,
  Smartphone,
  Building2,
  Tag,
  Check,
  X,
  Loader2,
  ShieldCheck,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    id: string;
    title: string;
    price: number;
    thumbnail_url?: string | null;
    instructor?: string | null;
  };
}

const paymentMethods: { id: PaymentMethod; name: string; icon: React.ReactNode; color: string }[] = [
  { id: "bkash", name: "bKash", icon: <Smartphone className="h-5 w-5" />, color: "bg-pink-500" },
  { id: "nagad", name: "Nagad", icon: <Smartphone className="h-5 w-5" />, color: "bg-orange-500" },
  { id: "card", name: "Card", icon: <CreditCard className="h-5 w-5" />, color: "bg-blue-500" },
  { id: "bank", name: "Bank", icon: <Building2 className="h-5 w-5" />, color: "bg-green-600" },
];

export function PaymentModal({ open, onOpenChange, course }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("bkash");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    description: string;
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const validateCoupon = useValidateCoupon();
  const initiatePayment = useInitiatePayment();

  const originalPrice = Number(course.price);
  const discountAmount = appliedCoupon?.discount || 0;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const selectedMethodInfo = paymentMethods.find(m => m.id === selectedMethod);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    try {
      const result = await validateCoupon.mutateAsync({
        code: couponCode.trim(),
        courseId: course.id,
        amount: originalPrice,
      });

      if (result.valid && result.coupon && result.discount_amount) {
        setAppliedCoupon({
          code: result.coupon.code,
          discount: result.discount_amount,
          description: result.coupon.description,
        });
        toast.success(`Coupon applied! You save ৳${result.discount_amount.toFixed(0)}`);
      } else {
        toast.error(result.error || "Invalid coupon");
      }
    } catch (error) {
      toast.error("Failed to validate coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handlePaymentClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmPayment = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowConfirmation(false);
    onOpenChange(false); // Close the main payment modal too
    
    initiatePayment.mutate({
      courseId: course.id,
      courseTitle: course.title,
      amount: originalPrice,
      paymentMethod: selectedMethod,
      couponCode: appliedCoupon?.code,
      discountAmount: discountAmount,
      finalAmount: finalPrice,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Complete Your Purchase</DialogTitle>
            <DialogDescription className="sr-only">
              Purchase {course.title} for ৳{finalPrice.toFixed(0)}
            </DialogDescription>
          </DialogHeader>
          
          {/* Course Info */}
          <div className="flex gap-4 mt-4">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-20 h-14 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
              {course.instructor && (
                <p className="text-xs text-muted-foreground mt-1">by {course.instructor}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Methods */}
          <div>
            <h4 className="text-sm font-medium mb-3">Select Payment Method</h4>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    selectedMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn("p-2 rounded-full text-white", method.color)}>
                    {method.icon}
                  </div>
                  <span className="text-xs font-medium">{method.name}</span>
                  {selectedMethod === method.id && (
                    <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Coupon Code */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Have a coupon?
            </h4>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
                    {appliedCoupon.code}
                  </Badge>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    -৳{appliedCoupon.discount.toFixed(0)} off
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={validateCoupon.isPending}
                >
                  {validateCoupon.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Try: WELCOME50, FLAT100, LEARN25
            </p>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Price</span>
              <span>৳{originalPrice.toFixed(0)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-৳{discountAmount.toFixed(0)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">৳{finalPrice.toFixed(0)}</span>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Secured by SSLCommerz</span>
            <Lock className="h-3 w-3" />
          </div>

          {/* Pay Button */}
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handlePaymentClick}
            disabled={initiatePayment.isPending}
          >
            {initiatePayment.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay ৳{finalPrice.toFixed(0)}
              </>
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Your Purchase
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to purchase <strong>"{course.title}"</strong>
                </p>
                
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Course Price:</span>
                    <span>৳{originalPrice.toFixed(0)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-৳{discountAmount.toFixed(0)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary">৳{finalPrice.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <span>Payment Method:</span>
                    <Badge variant="secondary" className="capitalize">
                      {selectedMethodInfo?.name}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  By confirming, you agree to proceed with the payment. This action cannot be undone once the payment is processed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmPayment} disabled={initiatePayment.isPending}>
              {initiatePayment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm & Pay ৳${finalPrice.toFixed(0)}`
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
