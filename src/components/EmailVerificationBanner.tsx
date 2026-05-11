import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Only show if user exists, email is not confirmed, and not dismissed
  if (!user || user.email_confirmed_at || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user.email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Please verify your email address
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            We sent a verification email to <strong>{user.email}</strong>. Please check your inbox
            and click the link to verify your account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
            className="whitespace-nowrap"
          >
            {isResending ? "Sending..." : "Resend Email"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
