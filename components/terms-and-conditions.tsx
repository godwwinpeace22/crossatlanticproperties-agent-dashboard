"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TermsAndConditionsProps {
  isOpen: boolean;
  onAccept: (acceptedTerms: TermsAcceptance) => Promise<void> | void;
  onDecline: () => void;
  title?: string;
  description?: string;
  showDialog?: boolean;
  userId?: string;
}

interface TermsAcceptance {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

const TERMS_CONTENT = {
  terms: `TERMS OF SERVICE

Last Updated: October 15, 2025

1. ACCEPTANCE OF TERMS
By accessing and using Crossatlantic Properties' platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.

2. SERVICES PROVIDED
Crossatlantic Properties provides a multi-level marketing platform for real estate investment opportunities. Our services include property listings, investment tracking, commission management, and referral systems.

3. USER RESPONSIBILITIES
- Provide accurate and truthful information
- Comply with all applicable laws and regulations
- Maintain the confidentiality of your account credentials
- Use the platform only for lawful purposes
- Report any suspicious or fraudulent activities

4. INVESTMENT RISKS
- Real estate investments carry inherent risks
- Past performance does not guarantee future results
- You should seek independent financial advice before investing
- We do not guarantee returns on investments

5. KYC AND COMPLIANCE
- All users must complete KYC (Know Your Customer) verification
- We reserve the right to verify your identity at any time
- Non-compliance may result in account suspension or termination

6. COMMISSION AND PAYMENTS
- Commission structures are subject to change with notice
- Payment processing may take up to 30 business days
- Application fees are non-refundable
- All payments are subject to applicable taxes

7. INTELLECTUAL PROPERTY
- All content on the platform is owned by Crossatlantic Properties
- Users retain rights to their uploaded documents and content
- Unauthorized use of our intellectual property is prohibited

8. LIMITATION OF LIABILITY
Crossatlantic Properties shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.

9. TERMINATION
We may terminate or suspend your account at our discretion for violations of these terms or applicable laws.

10. GOVERNING LAW
These terms are governed by the laws of Nigeria and any disputes shall be resolved in Nigerian courts.

11. CHANGES TO TERMS
We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.

12. CONTACT INFORMATION
For questions about these terms, contact us at legal@crossatlanticproperties.com`,

  privacy: `PRIVACY POLICY

Last Updated: October 15, 2025

1. INFORMATION WE COLLECT
We collect information you provide directly to us, such as:
- Personal identification information (name, email, phone number)
- Financial information for KYC verification
- Government-issued identification documents
- Banking and payment information
- Property investment preferences and history

2. HOW WE USE YOUR INFORMATION
- To provide and maintain our services
- To process transactions and send confirmations
- To verify your identity and prevent fraud
- To communicate with you about your account
- To comply with legal and regulatory requirements
- To improve our services and user experience

3. INFORMATION SHARING
We may share your information with:
- Service providers who assist in platform operations
- Regulatory authorities when required by law
- Business partners for referral and commission processing
- Legal counsel in case of disputes

4. DATA SECURITY
We implement appropriate security measures to protect your information:
- Encryption of sensitive data in transit and at rest
- Regular security audits and updates
- Access controls and authentication systems
- Secure data storage with reputable providers

5. YOUR RIGHTS
You have the right to:
- Access your personal information
- Correct inaccurate information
- Request deletion of your data (subject to legal requirements)
- Withdraw consent for marketing communications
- File complaints with relevant data protection authorities

6. COOKIES AND TRACKING
We use cookies and similar technologies to:
- Maintain your session and preferences
- Analyze platform usage and performance
- Provide personalized content and recommendations

7. DATA RETENTION
We retain your information for as long as necessary to:
- Provide our services
- Comply with legal obligations
- Resolve disputes and enforce agreements
- Maintain business records

8. INTERNATIONAL TRANSFERS
Your information may be transferred to and processed in countries other than Nigeria, subject to appropriate safeguards.

9. CHILDREN'S PRIVACY
Our services are not intended for users under 18 years of age. We do not knowingly collect information from minors.

10. CHANGES TO THIS POLICY
We may update this privacy policy from time to time. We will notify you of significant changes via email or platform notifications.

11. CONTACT US
For privacy-related questions, contact us at privacy@crossatlanticproperties.com`,
};

export function TermsAndConditions({
  isOpen,
  onAccept,
  onDecline,
  title = "Terms and Conditions",
  description = "Please review and accept our terms and conditions to continue",
  showDialog = true,
  userId,
}: TermsAndConditionsProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "Acceptance Required",
        description:
          "You must accept both Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const acceptanceData: TermsAcceptance = {
        termsAccepted,
        privacyAccepted,
        marketingConsent,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Store acceptance in database if user is logged in
      if (userId) {
        const supabase = createClient();
        const { error } = await supabase.from("terms_acceptances").insert({
          user_id: userId,
          terms_accepted: termsAccepted,
          privacy_accepted: privacyAccepted,
          marketing_consent: marketingConsent,
          user_agent: navigator.userAgent,
          accepted_at: acceptanceData.timestamp,
        });

        if (error) {
          console.error("Error storing terms acceptance:", error);
          // Continue anyway as this shouldn't block the user
        }
      }

      await onAccept(acceptanceData);

      toast({
        title: "Terms Accepted",
        description: "Thank you for accepting our terms and conditions.",
      });
    } catch (error) {
      console.error("Error accepting terms:", error);
      toast({
        title: "Error",
        description: "Failed to process acceptance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTerms = () => {
    const content = `${TERMS_CONTENT.terms}\n\n---\n\n${TERMS_CONTENT.privacy}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crossatlantic-properties-terms-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const TermsContent = () => (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b">
        <Button
          variant={activeTab === "terms" ? "default" : "ghost"}
          onClick={() => setActiveTab("terms")}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          Terms of Service
        </Button>
        <Button
          variant={activeTab === "privacy" ? "default" : "ghost"}
          onClick={() => setActiveTab("privacy")}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          Privacy Policy
        </Button>
      </div>

      {/* Content */}
      <div className="h-[400px] w-full rounded border p-4 overflow-y-auto">
        <div className="whitespace-pre-wrap text-sm">
          {activeTab === "terms" ? TERMS_CONTENT.terms : TERMS_CONTENT.privacy}
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={downloadTerms}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Terms & Privacy Policy
        </Button>
      </div>

      {/* Acceptance Checkboxes */}
      <div className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Please read the complete terms and privacy policy before accepting.
            Downloaded documents will serve as your reference copy.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms-accept"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            />
            <label
              htmlFor="terms-accept"
              className="text-sm font-medium leading-5 cursor-pointer"
            >
              I have read, understood, and agree to the Terms of Service
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy-accept"
              checked={privacyAccepted}
              onCheckedChange={(checked) =>
                setPrivacyAccepted(checked === true)
              }
            />
            <label
              htmlFor="privacy-accept"
              className="text-sm font-medium leading-5 cursor-pointer"
            >
              I have read, understood, and agree to the Privacy Policy
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="marketing-consent"
              checked={marketingConsent}
              onCheckedChange={(checked) =>
                setMarketingConsent(checked === true)
              }
            />
            <label
              htmlFor="marketing-consent"
              className="text-sm leading-5 cursor-pointer"
            >
              I consent to receive marketing communications about new properties
              and investment opportunities (optional)
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  if (showDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onDecline()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <TermsContent />
          </div>

          <DialogFooter className="flex-shrink-0 gap-2">
            <Button
              variant="outline"
              onClick={onDecline}
              disabled={isSubmitting}
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!termsAccepted || !privacyAccepted || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Accept & Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Card version for embedded use
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <TermsContent />
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onDecline} disabled={isSubmitting}>
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!termsAccepted || !privacyAccepted || isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Accept & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Standalone component for viewing terms
export function TermsViewer() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Terms & Conditions</h1>
        <p className="text-muted-foreground">
          Our terms of service and privacy policy
        </p>
      </div>

      <TermsAndConditions
        isOpen={true}
        onAccept={() => {}}
        onDecline={() => {}}
        showDialog={false}
      />
    </div>
  );
}
