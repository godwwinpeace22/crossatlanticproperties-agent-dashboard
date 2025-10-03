"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Share2,
  Link as LinkIcon,
  MessageSquare,
  Mail,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface PropertyShareButtonProps {
  propertyTitle: string;
  propertyUrl: string;
  variant?: "default" | "outline";
  className?: string;
  fullWidth?: boolean;
}

export function PropertyShareButton({
  propertyTitle,
  propertyUrl,
  variant = "outline",
  className = "",
  fullWidth = false,
}: PropertyShareButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    // Check for native share API support
    setHasNativeShare(typeof navigator !== "undefined" && "share" in navigator);
    fetchReferralCode();
  }, []);

  const fetchReferralCode = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("referral_id")
          .eq("id", user.id)
          .single();

        if (profile?.referral_id) {
          setReferralCode(profile.referral_id);
        }
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getShareUrl = () => {
    if (referralCode) {
      return `${propertyUrl}?ref=${referralCode}`;
    }
    return propertyUrl;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast({
        title: "Link copied!",
        description: referralCode
          ? "Property link with your referral code copied to clipboard"
          : "Property link copied to clipboard",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareViaWhatsApp = () => {
    const message = referralCode
      ? `Check out this amazing property: ${propertyTitle}\n\nUse my referral code ${referralCode} when you express interest!\n\n${getShareUrl()}`
      : `Check out this amazing property: ${propertyTitle}\n\n${getShareUrl()}`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setIsOpen(false);
  };

  const handleShareViaEmail = () => {
    const subject = `Check out this property: ${propertyTitle}`;
    const body = referralCode
      ? `I wanted to share this amazing property with you:\n\n${propertyTitle}\n\nWhen you express interest, use my referral code: ${referralCode}\n\n${getShareUrl()}\n\nBest regards`
      : `I wanted to share this amazing property with you:\n\n${propertyTitle}\n\n${getShareUrl()}\n\nBest regards`;

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setIsOpen(false);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: propertyTitle,
        text: referralCode
          ? `Check out this property! Use my referral code: ${referralCode}`
          : `Check out this property!`,
        url: getShareUrl(),
      });
      setIsOpen(false);
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <>
      <Button
        variant={variant}
        className={`${fullWidth ? "w-full justify-start" : ""} ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share Property
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Property</DialogTitle>
            <DialogDescription>
              {referralCode
                ? `Your referral code (${referralCode}) will be included in the shared link`
                : "Share this property with others"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {referralCode && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2">
                <p className="text-sm font-medium text-primary">
                  ✨ Your referral code will be attached!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  When someone uses your link, they'll see your referral code
                  automatically
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopyLink}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleShareViaWhatsApp}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Share via WhatsApp
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleShareViaEmail}
            >
              <Mail className="mr-2 h-4 w-4" />
              Share via Email
            </Button>

            {hasNativeShare && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleNativeShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                More Options
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
