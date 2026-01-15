import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailVerificationPendingProps {
  email: string;
  onBack?: () => void;
}

const EmailVerificationPending = ({ email, onBack }: EmailVerificationPendingProps) => {
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification email sent!");
        setResendCount(resendCount + 1);
        setCooldown(60); // 60 second cooldown
      }
    } catch (error) {
      toast.error("Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background px-6 py-8">
      <button
        onClick={handleBackToLogin}
        className="p-1 self-start mb-8"
        aria-label="Go back"
      >
        <ArrowLeft className="w-6 h-6 text-foreground" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground max-w-sm">
            We've sent a verification link to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 max-w-sm space-y-3">
          <div className="flex items-start gap-3 text-left">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Check your spam or junk folder if you don't see it
            </p>
          </div>
        </div>

        <div className="space-y-3 w-full max-w-sm">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleResendEmail}
            disabled={cooldown > 0 || isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend verification email
              </>
            )}
          </Button>

          <Button className="w-full" onClick={handleBackToLogin}>
            Back to login
          </Button>
        </div>

        {resendCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Email resent {resendCount} time{resendCount > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPending;
