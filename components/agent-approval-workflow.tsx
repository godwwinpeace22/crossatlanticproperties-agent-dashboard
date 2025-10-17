"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  FileText,
  User,
  Shield,
  AlertTriangle,
  RotateCw,
  XCircle,
  Upload,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { KYCForm } from "@/components/kyc-form";
import { KYCStatusCard } from "@/components/kyc-status-card";
import { createClient } from "@/lib/supabase/client";
import { KYCSubmission, KYCFormData } from "@/lib/types";

type AgentApprovalStep =
  | "verification"
  | "terms"
  | "kyc_check"
  | "kyc_form"
  | "pending"
  | "approved";

interface FileUploads {
  government_id?: File;
  proof_of_address?: File;
  business_documents?: File[];
}

export function AgentApprovalWorkflow() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // State management
  const [currentStep, setCurrentStep] =
    useState<AgentApprovalStep>("verification");
  const [kycSubmission, setKYCSubmission] = useState<KYCSubmission | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Check agent status when component mounts
  useEffect(() => {
    if (user) {
      checkAgentStatus();
    }
  }, [user]);

  const checkAgentStatus = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const supabase = createClient();

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      setUserProfile(profile);

      // If user is already approved, skip workflow
      if (profile.agent_activated && profile.role === "agent") {
        setCurrentStep("approved");
        setIsLoading(false);
        return;
      }

      // Check KYC status
      const { data: kycData, error: kycError } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (kycError) {
        console.error("Error fetching KYC:", kycError);
        setCurrentStep("kyc_check");
        setIsLoading(false);
        return;
      }

      const latestKYC = kycData?.[0];
      setKYCSubmission(latestKYC || null);

      // Determine current step based on KYC status
      if (!latestKYC) {
        setCurrentStep("verification");
      } else if (latestKYC.status === "approved") {
        setCurrentStep("pending");
      } else if (latestKYC.status === "pending") {
        setCurrentStep("pending");
      } else {
        // rejected or needs_revision
        setCurrentStep("kyc_check");
      }
    } catch (error) {
      console.error("Error checking agent status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKYCSubmit = async (formData: KYCFormData, files: FileUploads) => {
    if (!user) return;

    setIsSubmittingKYC(true);
    try {
      const supabase = createClient();

      // Upload files to storage
      const uploadedUrls: { [key: string]: string | string[] } = {};

      // Upload individual files
      for (const [fileType, file] of Object.entries(files)) {
        if (!file) continue;

        if (Array.isArray(file)) {
          // Handle multiple files (business documents)
          const urls: string[] = [];
          for (const singleFile of file) {
            const fileName = `kyc/${user.id}/${fileType}/${Date.now()}_${
              singleFile.name
            }`;
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("user-documents")
                .upload(fileName, singleFile);

            if (uploadError) throw uploadError;
            urls.push(uploadData.path);
          }
          uploadedUrls[fileType] = urls;
        } else {
          // Handle single file
          const fileName = `kyc/${user.id}/${fileType}/${Date.now()}_${
            file.name
          }`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("user-documents")
              .upload(fileName, file);

          if (uploadError) throw uploadError;
          uploadedUrls[fileType] = uploadData.path;
        }
      }

      // Create KYC submission
      const { data: kycData, error: kycError } = await supabase
        .from("kyc_submissions")
        .insert({
          user_id: user.id,
          buyer_type: formData.buyer_type,
          full_name: formData.full_name,
          company_name: formData.company_name,
          date_of_birth: formData.date_of_birth,
          incorporation_date: formData.incorporation_date,
          nationality: formData.nationality,
          country_of_incorporation: formData.country_of_incorporation,
          address: formData.address,
          phone_number: formData.phone_number,
          email_address: formData.email_address,
          occupation: formData.occupation,
          nature_of_business: formData.nature_of_business,
          annual_income: formData.annual_income
            ? parseFloat(formData.annual_income)
            : null,
          investment_source: formData.investment_source,
          government_id_url: uploadedUrls.government_id as string,
          proof_of_address_url: uploadedUrls.proof_of_address as string,
          business_documents_urls: uploadedUrls.business_documents as string[],
        })
        .select()
        .single();

      if (kycError) throw kycError;

      setKYCSubmission(kycData);
      setCurrentStep("pending");

      toast({
        title: "Agent Application Submitted",
        description:
          "Your KYC documents have been submitted for review. You'll be notified once approved.",
      });
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast({
        title: "Submission Failed",
        description:
          "There was an error submitting your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingKYC(false);
    }
  };

  const getStepStatus = (step: AgentApprovalStep) => {
    const stepOrder: AgentApprovalStep[] = [
      "verification",
      "terms",
      "kyc_check",
      "kyc_form",
      "pending",
      "approved",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <RotateCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Checking your agent status...</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case "verification":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Agent Verification Required
              </CardTitle>
              <CardDescription>
                Welcome! To become an approved agent, you need to complete our
                verification process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Agent Benefits:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Earn commissions on property sales</li>
                  <li>• Multi-level commission structure</li>
                  <li>• Access to exclusive properties</li>
                  <li>• Professional tools and support</li>
                  <li>• Build your own agent network</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900 mb-1">
                      Verification Process:
                    </p>
                    <ul className="text-yellow-800 space-y-1">
                      <li>• Complete KYC documentation</li>
                      <li>• Submit required identification documents</li>
                      <li>• Wait for admin approval</li>
                      <li>• Account activation as agent</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setCurrentStep("terms")}
                className="w-full"
              >
                Start Verification Process
              </Button>
            </CardContent>
          </Card>
        );

      case "terms":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Terms & Conditions
              </CardTitle>
              <CardDescription>
                Please review and accept our Agent Terms & Conditions before
                continuing to KYC verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 border p-4 rounded-lg text-sm text-gray-700 max-h-64 overflow-y-auto">
                <p className="mb-2 font-semibold">Summary:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Agents must represent properties honestly and fairly.</li>
                  <li>All commissions and referrals follow platform policy.</li>
                  <li>
                    Data privacy and client confidentiality must be maintained.
                  </li>
                  <li>
                    Violation may lead to suspension or account termination.
                  </li>
                </ul>
                <p className="mt-4 text-sm text-gray-600">
                  Please download and review the full terms for details.
                </p>
              </div>

              <a
                href="/terms/agent-terms.pdf"
                download
                className="text-blue-600 underline text-sm"
              >
                Download Full Terms (PDF)
              </a>

              <div className="flex items-center space-x-2">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                  I have read and agree to the Terms & Conditions
                </label>
              </div>

              <Button
                className="w-full"
                onClick={() => setCurrentStep("kyc_form")}
                disabled={!acceptedTerms}
              >
                Continue to KYC Verification
              </Button>
            </CardContent>
          </Card>
        );

      case "kyc_check":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                KYC Verification
              </CardTitle>
              <CardDescription>
                Complete your Know Your Customer verification to become an
                approved agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {kycSubmission && <KYCStatusCard kycSubmission={kycSubmission} />}

              {!kycSubmission ||
              kycSubmission.status === "rejected" ||
              kycSubmission.status === "needs_revision" ? (
                <Button
                  onClick={() => setCurrentStep("kyc_form")}
                  className="w-full"
                >
                  {!kycSubmission
                    ? "Complete KYC Verification"
                    : "Update KYC Application"}
                </Button>
              ) : (
                <div className="text-center p-4">
                  <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Your KYC is currently under review
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "kyc_form":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Complete Agent KYC Form</CardTitle>
              <CardDescription>
                Provide accurate information and upload required documents for
                verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KYCForm
                onSubmit={handleKYCSubmit}
                onCancel={() => setCurrentStep("kyc_check")}
                isSubmitting={isSubmittingKYC}
              />
            </CardContent>
          </Card>
        );

      case "pending":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Application Under Review
              </CardTitle>
              <CardDescription>
                Your agent application is being reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {kycSubmission && <KYCStatusCard kycSubmission={kycSubmission} />}

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900 mb-1">
                      What happens next:
                    </p>
                    <ul className="text-yellow-800 space-y-1">
                      <li>• Admin team will review your KYC documents</li>
                      <li>• You'll receive email updates on the status</li>
                      <li>• Process typically takes 2-3 business days</li>
                      <li>• Your account will be activated upon approval</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={checkAgentStatus}
                  className="w-full"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "approved":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Agent Approved!
              </CardTitle>
              <CardDescription>
                Congratulations! Your agent account has been approved and
                activated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 mb-1">
                      You can now:
                    </p>
                    <ul className="text-green-800 space-y-1">
                      <li>• Access the full agent dashboard</li>
                      <li>• Generate and share your referral code</li>
                      <li>• Refer clients and earn commissions</li>
                      <li>• Build your agent network</li>
                      <li>• Track your earnings and performance</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/referrals")}
                  className="w-full"
                >
                  View Referral Code
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Progress indicator
  const ProgressIndicator = () => {
    const steps = [
      { id: "verification", label: "Start", icon: User },
      { id: "terms", label: "Terms", icon: FileText },
      { id: "kyc_check", label: "KYC", icon: FileText },
      { id: "pending", label: "Review", icon: Clock },
      { id: "approved", label: "Approved", icon: CheckCircle },
    ];

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const status = getStepStatus(step.id as AgentApprovalStep);

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    status === "completed"
                      ? "bg-green-100 border-green-500 text-green-600"
                      : status === "current"
                      ? "bg-blue-100 border-blue-500 text-blue-600"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-2 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      status === "completed"
                        ? "text-green-600"
                        : status === "current"
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      getStepStatus(
                        steps[index + 1].id as AgentApprovalStep
                      ) === "completed" ||
                      getStepStatus(
                        steps[index + 1].id as AgentApprovalStep
                      ) === "current"
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Agent Verification</h1>
        <p className="text-muted-foreground">
          Complete the verification process to become an approved agent
        </p>
      </div>

      <ProgressIndicator />
      {renderStepContent()}
    </div>
  );
}
