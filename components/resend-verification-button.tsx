"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type ResendVerificationButtonProps = {
  email?: string;
  next?: string;
};

export function ResendVerificationButton({
  email,
  next,
}: ResendVerificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(
    null,
  );

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      setFeedback("Missing email address. Please go back and sign up again.");
      setFeedbackType("error");
      return;
    }

    setIsLoading(true);
    setFeedback("");
    setFeedbackType(null);

    try {
      const supabase = createClient();
      const redirectPath = next || "/dashboard";

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
      });

      if (error) {
        throw error;
      }

      setFeedback("Verification email sent. Please check your inbox.");
      setFeedbackType("success");
      setCooldown(30);
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to resend verification email.",
      );
      setFeedbackType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={isLoading || !email || cooldown > 0}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : cooldown > 0 ? (
          `Resend in ${cooldown}s`
        ) : (
          "Resend verification email"
        )}
      </Button>

      {cooldown > 0 && (
        <p className="text-xs text-muted-foreground">
          You can request another email in {cooldown} seconds.
        </p>
      )}

      {feedback && (
        <p
          className={`text-sm ${
            feedbackType === "success" ? "text-green-600" : "text-destructive"
          }`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
