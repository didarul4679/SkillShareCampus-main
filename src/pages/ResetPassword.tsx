import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from password reset email
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true);
      } else {
        toast.error("Invalid or expired reset link");
        setTimeout(() => navigate("/forgot-password"), 2000);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse({ password, confirmPassword });
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        toast.error(error.message || "Failed to reset password");
      } else {
        toast.success("Password reset successfully!");
        setTimeout(() => navigate("/campus"), 2000);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-muted-foreground">Verifying reset link...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-center mb-2 text-foreground">
            Set New Password
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            Enter your new password below.
          </p>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-normal text-foreground">
                New Password
              </Label>
              <Input 
                id="password"
                type="password" 
                placeholder="Enter new password"
                className="h-11 bg-white border-gray-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-normal text-foreground">
                Confirm New Password
              </Label>
              <Input 
                id="confirmPassword"
                type="password" 
                placeholder="Confirm new password"
                className="h-11 bg-white border-gray-300"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full h-11 bg-[hsl(var(--link-blue))] hover:bg-[hsl(var(--link-blue))]/90 text-white font-normal text-base mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResetPassword;
