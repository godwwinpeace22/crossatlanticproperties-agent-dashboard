"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  ArrowRight,
  Home,
  FileText,
  CreditCard,
  User,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  RefreshCw,
  RotateCw,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { KYCForm } from "@/components/kyc-form";
import { KYCStatusCard } from "@/components/kyc-status-card";
import { createClient } from "@/lib/supabase/client";
import { usePublicSystemSettings } from "@/hooks/use-system-settings";
import {
  Property,
  KYCSubmission,
  KYCFormData,
  PaymentPlan,
  PaymentPlanOption,
  PropertyInterest,
  InterestPayment,
} from "@/lib/types";

interface PropertyInterestWorkflowProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

type WorkflowStep =
  | "auth_check"
  | "kyc_check"
  | "kyc_form"
  | "payment_plan"
  | "confirmation"
  | "payment"
  | "success";

// Payment Plan Options
const PAYMENT_PLAN_OPTIONS: PaymentPlanOption[] = [
  {
    id: "full",
    name: "Full Payment",
    description: "Pay the complete amount upfront",
    installments: 1,
    percentages: [100],
  },
  {
    id: "30-30-40",
    name: "3-Installment Plan",
    description: "30% - 30% - 40% over selected timeframe",
    installments: 3,
    percentages: [30, 30, 40],
  },
  {
    id: "25x4",
    name: "4-Installment Plan",
    description: "25% each over selected timeframe",
    installments: 4,
    percentages: [25, 25, 25, 25],
  },
];

interface FileUploads {
  government_id?: File;
  proof_of_address?: File;
  business_documents?: File[];
  application_fee_payment_proof?: File;
}

export function PropertyInterestWorkflow({
  property,
  isOpen,
  onClose,
}: PropertyInterestWorkflowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { getSetting } = usePublicSystemSettings();

  // State management
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("auth_check");
  const [kycSubmission, setKYCSubmission] = useState<KYCSubmission | null>(
    null
  );
  const [selectedPaymentPlan, setSelectedPaymentPlan] =
    useState<PaymentPlan | null>(null);
  const [paymentTimeframe, setPaymentTimeframe] = useState<number>(12); // months
  const [referralCode, setReferralCode] = useState("");
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(
    null
  );
  const [referringAgentName, setReferringAgentName] = useState<string>("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [propertyInterest, setPropertyInterest] =
    useState<PropertyInterest | null>(null);
  const [interestPayment, setInterestPayment] =
    useState<InterestPayment | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  // Auto-fill referral code from URL parameter
  useEffect(() => {
    if (isOpen) {
      const refParam = searchParams?.get("ref");
      if (refParam && refParam.length === 8) {
        setReferralCode(refParam.toUpperCase());
        // Automatically validate the code
        validateReferralCode(refParam.toUpperCase());
      }
    }
  }, [isOpen, searchParams]);

  // Check authentication and KYC status when dialog opens
  useEffect(() => {
    if (isOpen) {
      checkAuthAndKYCStatus();
    }
  }, [isOpen, isAuthenticated]);

  const checkAuthAndKYCStatus = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        setCurrentStep("auth_check");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      // Check if user already has an interest for this property
      const { data: existingInterest } = await supabase
        .from("property_interests")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("property_id", property.id)
        .single();

      if (existingInterest) {
        toast({
          title: "Interest Already Submitted",
          description: `You have already expressed interest in this property. Status: ${existingInterest.status}`,
          variant: "destructive",
        });
        setIsLoading(false);
        onClose();
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
        // console.error("Error fetching KYC:", kycError);
        setCurrentStep("kyc_check");
        setIsLoading(false);
        return;
      }

      const latestKYC = kycData?.[0];
      setKYCSubmission(latestKYC || null);

      // Determine next step based on KYC status and system settings
      const requireKYCApproval = getSetting(
        "kyc_approval_required_for_payment",
        false
      );

      if (!latestKYC) {
        setCurrentStep("kyc_form");
      } else if (latestKYC.status === "approved" || !requireKYCApproval) {
        setCurrentStep("payment_plan");
      } else if (latestKYC.status === "pending" && !requireKYCApproval) {
        setCurrentStep("payment_plan");
      } else {
        // rejected, needs_revision, or pending but requiring approval
        setCurrentStep("payment_plan");
      }
    } catch (error) {
      console.error("Error checking auth/KYC status:", error);
      setCurrentStep("auth_check");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInRedirect = () => {
    onClose();
    localStorage.setItem("redirect", `/properties/${property.id}`);
    router.push("/login");
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
                .from("documents")
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
            await supabase.storage.from("documents").upload(fileName, file);

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
          application_fee_payment_proof:
            uploadedUrls.application_fee_payment_proof as string,
          application_fee_paid: !!files.application_fee_payment_proof,
        })
        .select()
        .single();

      if (kycError) throw kycError;

      setKYCSubmission(kycData);
      setCurrentStep("payment_plan");

      toast({
        title: "KYC Submitted Successfully",
        description:
          "Your KYC application has been submitted and is pending review.",
      });
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast({
        title: "KYC Submission Failed",
        description:
          "There was an error submitting your KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingKYC(false);
    }
  };

  const handlePaymentPlanSubmit = () => {
    if (!selectedPaymentPlan) {
      toast({
        title: "Payment Plan Required",
        description: "Please select a payment plan to continue.",
        variant: "destructive",
      });
      return;
    }
    // Go to application fee payment step
    setCurrentStep("payment");
  };

  // Initialize application fee payment with Paystack
  const handleInitializePayment = async () => {
    if (!user || !selectedPaymentPlan) return;

    setIsInitializingPayment(true);
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: property.id,
          property_name: property.name,
          payment_plan: selectedPaymentPlan,
          callback_url: `${window.location.origin}/payment/verify`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize payment");
      }

      const data = await response.json();

      if (data.success && data.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error("Invalid payment response");
      }
    } catch (error) {
      console.error("Error initializing payment:", error);
      toast({
        title: "Payment Initialization Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializingPayment(false);
    }
  };

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    if (!code || code.trim() === "") {
      setReferralCodeValid(null);
      setReferringAgentName("");
      return;
    }

    setIsValidatingCode(true);
    try {
      const supabase = createClient();
      const { data: agent, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("referral_id", code.toUpperCase())
        .eq("role", "agent")
        .single();

      if (error || !agent) {
        setReferralCodeValid(false);
        setReferringAgentName("");
      } else if (user && agent.id === user.id) {
        // Check if user is trying to use their own referral code
        setReferralCodeValid(false);
        setReferringAgentName("");
        toast({
          title: "Invalid Referral Code",
          description: "You cannot use your own referral code.",
          variant: "destructive",
        });
      } else {
        setReferralCodeValid(true);
        setReferringAgentName(agent.full_name || "Unknown Agent");
      }
    } catch (error) {
      setReferralCodeValid(false);
      setReferringAgentName("");
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Only called after payment is made
  const handleFinalSubmission = async () => {
    if (!user || !selectedPaymentPlan || !interestPayment) return;

    setIsLoading(true);
    try {
      const supabase = createClient();

      // Look up referring agent by referral code if provided
      let referringAgentId = null;
      if (referralCode) {
        const { data: agent } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_id", referralCode.toUpperCase())
          .eq("role", "agent")
          .single();

        if (agent) {
          referringAgentId = agent.id;
        }
      }

      // Create property interest
      const { data: interestData, error: interestError } = await supabase
        .from("property_interests")
        .insert({
          user_id: user.id,
          property_id: property.id,
          kyc_submission_id: kycSubmission?.id,
          interest_payment_id: interestPayment.id,
          selected_payment_plan: selectedPaymentPlan,
          payment_timeframe: paymentTimeframe,
          referral_code: referralCode ? referralCode.toUpperCase() : null,
          referring_agent_id: referringAgentId,
          status: "pending",
        })
        .select()
        .single();

      if (interestError) throw interestError;

      setPropertyInterest(interestData);

      // Update interest payment with property_interest_id
      await supabase
        .from("interest_payments")
        .update({ property_interest_id: interestData.id })
        .eq("id", interestPayment.id);

      // Calculate installment amounts and create schedule
      const totalAmount = property.promotional_price || property.price;
      await supabase.rpc("create_installment_schedule", {
        p_property_interest_id: interestData.id,
        p_total_amount: totalAmount,
        p_payment_plan: selectedPaymentPlan,
        p_timeframe_months: paymentTimeframe,
      });

      setCurrentStep("success");

      toast({
        title: "Payment Successful",
        description: "Your payment has been received. Thank you!",
      });
    } catch (error) {
      console.error("Error submitting property interest:", error);
      toast({
        title: "Submission Failed",
        description:
          "There was an error submitting your interest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate payment handler, then submit interest
  const handlePayment = async () => {
    // Here you would integrate payment gateway logic
    // After payment is successful, call handleFinalSubmission
    await handleFinalSubmission();
  };

  const getPropertyPrice = () => {
    if (property.is_promotional && property.promotional_price) {
      return property.promotional_price;
    }
    return property.original_price || property.price;
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <RotateCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case "auth_check":
        return (
          <div className="text-center p-6 space-y-4">
            <User className="h-12 w-12 mx-auto text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
              <p className="text-gray-600 mb-4">
                You need to sign in to express interest in properties.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleSignInRedirect} className="w-full">
                Sign In / Create Account
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        );

      case "kyc_check":
        // Ensure authentication is verified before showing KYC options
        if (!isAuthenticated || !user) {
          return (
            <div className="text-center p-6 space-y-4">
              <User className="h-12 w-12 mx-auto text-red-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Authentication Required
                </h3>
                <p className="text-gray-600 mb-4">
                  You must be signed in to access KYC verification.
                </p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleSignInRedirect} className="w-full">
                  Sign In / Create Account
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">KYC Verification</h3>
              <p className="text-gray-600">
                Complete your Know Your Customer verification to express
                interest in properties.
              </p>
            </div>

            {kycSubmission && <KYCStatusCard kycSubmission={kycSubmission} />}

            <div className="space-y-2">
              {!kycSubmission ||
              kycSubmission.status === "rejected" ||
              kycSubmission.status === "needs_revision" ? (
                <Button
                  onClick={() => setCurrentStep("kyc_form")}
                  className="w-full"
                >
                  {!kycSubmission
                    ? "Start KYC Process"
                    : "Update KYC Application"}
                </Button>
              ) : null}
              <Button variant="outline" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        );

      case "kyc_form":
        // Ensure authentication is verified before showing KYC form

        return (
          <div className="p-1">
            <KYCForm
              onSubmit={handleKYCSubmit}
              onCancel={() => setCurrentStep("payment_plan")}
              isSubmitting={isSubmittingKYC}
            />
          </div>
        );

      case "payment_plan":
        // Ensure user is authenticated and has approved KYC
        if (!user) {
          return (
            <div className="text-center p-6 space-y-4">
              <User className="h-12 w-12 mx-auto text-red-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Authentication Required
                </h3>
                <p className="text-gray-600 mb-4">
                  You must be signed in to select a payment plan.
                </p>
              </div>
              <DialogFooter className="space-y-2">
                <Button onClick={handleSignInRedirect} className="w-full">
                  Sign In / Create Account
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          );
        }

        const requireKYCApproval = getSetting(
          "kyc_approval_required_for_payment",
          false
        );

        if (!kycSubmission) {
          return (
            <div className="text-center p-6 space-y-4">
              <FileText className="h-12 w-12 mx-auto text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  KYC Verification Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Please complete your KYC verification before selecting a
                  payment plan.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => setCurrentStep("kyc_check")}
                  className="w-full"
                >
                  Complete KYC Verification
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          );
        }

        if (requireKYCApproval && kycSubmission.status !== "approved") {
          return (
            <div className="text-center p-6 space-y-4">
              <FileText className="h-12 w-12 mx-auto text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  KYC Approval Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Your KYC verification must be approved before selecting a
                  payment plan.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => setCurrentStep("kyc_check")}
                  className="w-full"
                >
                  Check KYC Status
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              {/* <CreditCard className="h-12 w-12 mx-auto text-blue-600 mb-4" /> */}
              <h3 className="text-lg font-semibold mb-2">
                Choose Payment Plan
              </h3>
              <p className="text-gray-600">
                Select how you'd like to pay for this property.
              </p>
            </div>

            {/* Payment Plans */}
            <div className="space-y-3">
              <h4 className="font-medium">Available Payment Plans:</h4>
              <div className="grid gap-3 md:grid-cols-3">
                {PAYMENT_PLAN_OPTIONS.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all relative ${
                      selectedPaymentPlan === plan.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPaymentPlan(plan.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{plan.name}</h5>
                          <p className="text-sm text-gray-600 mt-2">
                            {plan.description}
                          </p>
                          {/* <div className="text-xs text-gray-500 mt-1">
                            {plan.percentages.map((percent, index) => (
                              <span key={index}>
                                {percent}%
                                {index < plan.percentages.length - 1
                                  ? " → "
                                  : ""}
                              </span>
                            ))}
                          </div> */}
                        </div>
                        <div className="text-right absolute top-3 right-3">
                          {selectedPaymentPlan === plan.id && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Payment Timeframe */}
            {selectedPaymentPlan && selectedPaymentPlan !== "full" && (
              <div className="space-y-3">
                <Label>Payment Timeframe:</Label>
                <div className="flex gap-2">
                  {[6, 12, 18, 24].map((months) => (
                    <Button
                      key={months}
                      variant={
                        paymentTimeframe === months ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setPaymentTimeframe(months)}
                    >
                      {months} months
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Referral Code */}
            <div className="space-y-2">
              <Label htmlFor="referral-code">Referral Code (Optional)</Label>
              <div className="relative">
                <Input
                  id="referral-code"
                  placeholder="Enter 8-character referral code"
                  value={referralCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setReferralCode(value);
                    if (value.length === 8) {
                      validateReferralCode(value);
                    } else {
                      setReferralCodeValid(null);
                    }
                  }}
                  maxLength={8}
                  className={
                    referralCodeValid === true
                      ? "border-green-500"
                      : referralCodeValid === false
                      ? "border-red-500"
                      : ""
                  }
                />
                {isValidatingCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}
                {referralCodeValid === true && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                )}
                {referralCodeValid === false && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                )}
              </div>
              {referralCodeValid === true && referringAgentName && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      Valid referral code
                    </p>
                    <p className="text-xs text-green-700">
                      Referring Agent: {referringAgentName}
                    </p>
                  </div>
                </div>
              )}
              {referralCodeValid === false && (
                <p className="text-xs text-red-600">
                  Invalid referral code. Please check and try again.
                </p>
              )}
              {referralCodeValid === null && (
                <p className="text-xs text-muted-foreground">
                  If you were referred by an agent, enter their code here
                </p>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePaymentPlanSubmit} className="flex-1">
                Continue
              </Button>
            </DialogFooter>
          </div>
        );

      case "confirmation":
        // Ensure user is authenticated and has approved KYC
        if (!user) {
          return (
            <div className="text-center p-6 space-y-4">
              <User className="h-12 w-12 mx-auto text-red-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Authentication Required
                </h3>
                <p className="text-gray-600 mb-4">
                  You must be signed in to confirm your interest.
                </p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleSignInRedirect} className="w-full">
                  Sign In / Create Account
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          );
        }

        const kycApprovalRequired = getSetting(
          "kyc_approval_required_for_payment",
          false
        );

        if (
          !kycSubmission ||
          (kycApprovalRequired && kycSubmission.status !== "approved")
        ) {
          return (
            <div className="text-center p-6 space-y-4">
              <FileText className="h-12 w-12 mx-auto text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  KYC Approval Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Your KYC verification must be approved before confirming
                  interest.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => setCurrentStep("kyc_check")}
                  className="w-full"
                >
                  Check KYC Status
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          );
        }

        const totalPrice = getPropertyPrice();
        const selectedPlan = PAYMENT_PLAN_OPTIONS.find(
          (p) => p.id === selectedPaymentPlan
        );

        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Confirm Your Interest
              </h3>
              <p className="text-gray-600">
                Please review your selections before proceeding to payment.
              </p>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Interest Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property:</span>
                    <span className="font-medium">{property.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span>
                      {property.city}, {property.state}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-bold text-blue-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Plan:</span>
                    <span className="font-medium">{selectedPlan?.name}</span>
                  </div>
                  {selectedPaymentPlan !== "full" && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timeframe:</span>
                      <span>{paymentTimeframe} months</span>
                    </div>
                  )}
                  {referralCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referral Code:</span>
                      <span className="font-medium">{referralCode}</span>
                    </div>
                  )}
                </div>

                {selectedPlan && selectedPaymentPlan !== "full" && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">Payment Schedule:</h4>
                      {selectedPlan.percentages.map((percent, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span>Installment {index + 1}:</span>
                          <span className="font-medium">
                            {formatPrice(totalPrice * (percent / 100))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Next Steps:</p>
                  <ul className="text-blue-800 space-y-1">
                    <li>• Your interest will be submitted after payment</li>
                    <li>• You'll receive email updates on the status</li>
                    <li>• Payment schedule will be activated upon approval</li>
                    <li>• You can track progress in your dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("payment_plan")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("payment")}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Loading..." : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        );

      case "payment":
        const applicationFee = getSetting("application_fee_amount", 10000); // Configurable application fee
        const propertyPrice = getPropertyPrice();
        const paymentPlan = PAYMENT_PLAN_OPTIONS.find(
          (p) => p.id === selectedPaymentPlan
        );

        return (
          <div className="space-y-6">
            <div className="text-center">
              <CreditCard className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-blue-800">
                Pay Application Fee
              </h3>
              <p className="text-gray-600">
                Pay a one-time application fee of ₦10,000 to submit your
                interest.
              </p>
            </div>

            {/* Fee Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property:</span>
                    <span className="font-medium">{property.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Price:</span>
                    <span className="font-medium text-blue-600">
                      {formatPrice(propertyPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Plan:</span>
                    <span className="font-medium">{paymentPlan?.name}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">
                      Application Fee:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(applicationFee)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    One-time, non-refundable fee to process your interest
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Important:</p>
                  <ul className="text-blue-800 space-y-1">
                    <li>• This fee is separate from the property payment</li>
                    <li>• Payment is processed securely via Paystack</li>
                    <li>
                      • Your interest will be submitted after successful payment
                    </li>
                    <li>• Admin will review and approve your submission</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center p-6 space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-800">
                Payment Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Your payment has been received. Your property interest is now
                complete.
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render DialogFooter actions for each step
  const renderStepActions = () => {
    switch (currentStep) {
      case "payment":
        return (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => setCurrentStep("payment_plan")}
              className="flex-1"
              disabled={isInitializingPayment}
            >
              Back
            </Button>
            <Button
              onClick={handleInitializePayment}
              className="flex-1"
              disabled={isInitializingPayment}
            >
              {isInitializingPayment ? "Processing..." : "Pay ₦10,000"}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          {/* <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Express Interest in Property
          </DialogTitle>
          <DialogDescription>
            {property.name} - {property.city}, {property.state}
          </DialogDescription> */}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">{renderStepContent()}</div>
        {currentStep === "payment" && (
          <DialogFooter>{renderStepActions()}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
