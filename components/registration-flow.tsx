"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadUserDocument } from "@/lib/document-upload";
import { TermsAndConditions } from "@/components/terms-and-conditions";
import { KYCForm } from "@/components/kyc-form";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, FileText, User, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RegistrationStep = "terms" | "kyc" | "complete";

interface RegistrationFlowProps {
  onComplete?: () => void;
  redirectUrl?: string;
}

export function RegistrationFlow({
  onComplete,
  redirectUrl,
}: RegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("terms");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleTermsAccept = async () => {
    setCurrentStep("kyc");
  };

  const handleTermsDecline = () => {
    // Redirect back or show options
    router.push("/");
  };

  const handleKYCSubmit = async (formData: any, files: any) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Upload files using the centralized document upload system
      const uploadedDocuments: any = {};

      // Define document type mapping
      const documentTypeMap: { [key: string]: string } = {
        government_id: "Government ID",
        proof_of_address: "Proof of Address",
        application_fee_payment_proof: "Application Fee Payment Proof",
      };

      // Upload individual files
      for (const [fileType, file] of Object.entries(files)) {
        if (file && fileType !== "business_documents") {
          try {
            const result = await uploadUserDocument({
              file: file as File,
              userId: user.id,
              documentType: "kyc",
              documentName: documentTypeMap[fileType] || fileType,
              description: `KYC ${documentTypeMap[fileType] || fileType} for ${
                formData.buyer_type
              } application`,
              tags: ["kyc", formData.buyer_type, fileType],
            });
            uploadedDocuments[fileType] = result.id;
          } catch (error) {
            console.error(`Failed to upload ${fileType}:`, error);
            throw new Error(
              `Failed to upload ${documentTypeMap[fileType] || fileType}`,
            );
          }
        }
      }

      // Handle business documents (array)
      const businessDocumentIds: string[] = [];
      if (files.business_documents && Array.isArray(files.business_documents)) {
        for (let i = 0; i < files.business_documents.length; i++) {
          const file = files.business_documents[i];
          try {
            const result = await uploadUserDocument({
              file,
              userId: user.id,
              documentType: "kyc",
              documentName: `Business Document ${i + 1}`,
              description: `Business document ${i + 1} for ${
                formData.buyer_type
              } KYC application`,
              tags: ["kyc", formData.buyer_type, "business_document"],
            });
            businessDocumentIds.push(result.id);
          } catch (error) {
            console.error(
              `Failed to upload business document ${i + 1}:`,
              error,
            );
            throw new Error(`Failed to upload business document ${i + 1}`);
          }
        }
      }
      uploadedDocuments.business_documents = businessDocumentIds;

      // Create KYC submission (now references document IDs instead of file URLs)
      const supabase = createClient();
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
          country_of_residence: formData.country_of_residence,
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
          // Store document IDs instead of URLs - we'll need to update the schema
          government_id_document_id: uploadedDocuments.government_id,
          proof_of_address_document_id: uploadedDocuments.proof_of_address,
          business_document_ids: uploadedDocuments.business_documents,
          application_fee_payment_document_id:
            uploadedDocuments.application_fee_payment_proof,
          application_fee_paid: !!files.application_fee_payment_proof,
          // Keep the old columns for backwards compatibility temporarily
          government_id_url: null,
          proof_of_address_url: null,
          business_documents_urls: null,
          application_fee_payment_proof: null,
        })
        .select()
        .single();

      if (kycError) throw kycError;

      toast({
        title: "KYC Submitted Successfully",
        description:
          "Your KYC application has been submitted. You can now proceed with property interests and payments.",
      });

      setCurrentStep("complete");
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast({
        title: "KYC Submission Failed",
        description:
          "There was an error submitting your KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    const finalRedirectUrl = redirectUrl || "/dashboard";

    if (onComplete) {
      onComplete();
    } else {
      router.push(finalRedirectUrl);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep === "terms"
              ? "bg-blue-500 text-white"
              : currentStep === "kyc" || currentStep === "complete"
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
          }`}
        >
          {currentStep === "terms" ? (
            <FileText className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
        </div>
        <div
          className={`h-1 w-16 ${
            currentStep === "kyc" || currentStep === "complete"
              ? "bg-green-500"
              : "bg-gray-300"
          }`}
        />

        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep === "kyc"
              ? "bg-blue-500 text-white"
              : currentStep === "complete"
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
          }`}
        >
          {currentStep === "complete" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <div
          className={`h-1 w-16 ${
            currentStep === "complete" ? "bg-green-500" : "bg-gray-300"
          }`}
        />

        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep === "complete"
              ? "bg-green-500 text-white"
              : "bg-gray-300 text-gray-600"
          }`}
        >
          <CreditCard className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "terms":
        return (
          <TermsAndConditions
            isOpen={true}
            onAccept={handleTermsAccept}
            onDecline={handleTermsDecline}
            title="Welcome to Crossatlantic Properties"
            description="Before you can start investing, please review and accept our terms and conditions."
            showDialog={false}
            userId={user?.id}
          />
        );

      case "kyc":
        return (
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Complete your KYC verification to start investing. You can
                proceed to property interests and payments while your
                verification is being processed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KYCForm
                onSubmit={handleKYCSubmit}
                onCancel={() => setCurrentStep("terms")}
                isSubmitting={isLoading}
              />
            </CardContent>
          </Card>
        );

      case "complete":
        return (
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle>Registration Complete!</CardTitle>
              <CardDescription>
                Your account setup is complete. You can now browse properties
                and make investments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>✅ Terms and conditions accepted</p>
                <p>✅ KYC verification submitted</p>
                <p>
                  🔄 You can proceed with investments while verification is
                  processed
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full">
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container max-w-6xl">
        {renderStepIndicator()}

        <div className="flex justify-center">{renderCurrentStep()}</div>
      </div>
    </div>
  );
}
