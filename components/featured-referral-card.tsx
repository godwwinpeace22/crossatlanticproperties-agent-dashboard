"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, QrCode, MessageSquare, Mail } from "lucide-react";
import { CopyReferralButton } from "@/components/copy-referral-button";

interface FeaturedReferralCardProps {
  referralCode: string;
}

export function FeaturedReferralCard({
  referralCode,
}: FeaturedReferralCardProps) {
  const shareViaWhatsApp = () => {
    const message = `Hey! Check out these amazing properties. Use my referral code: ${referralCode} when you express interest to get started!`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareViaEmail = () => {
    const subject = "Property Investment Opportunity";
    const body = `Hey!\n\nI wanted to share these amazing property investment opportunities with you.\n\nWhen you express interest in a property, use my referral code: ${referralCode}\n\nThis will link us and help me assist you through the process!\n\nBest regards`;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5 text-primary" />
              <span className="text-black font-normal">
                Your Referral Code:
              </span>{" "}
              {referralCode || "Loading..."}
            </CardTitle>
            <CardDescription className="text-xs">
              Share with potential buyers to earn commissions
            </CardDescription>
          </div>

          <CopyReferralButton
            referralCode={referralCode}
            size="sm"
            variant="default"
            className="px-3"
          />
        </div>
      </CardHeader>
    </Card>
  );
}
