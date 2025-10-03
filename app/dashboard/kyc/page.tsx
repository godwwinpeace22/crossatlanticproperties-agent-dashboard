import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { KYCStatusCard } from "@/components/kyc-status-card";
import { KYCForm } from "@/components/kyc-form";
import { formatDate } from "@/lib/format";
import Link from "next/link";

export default async function MyKYCPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/dashboard/admin");
  }

  // Get user's KYC submission
  const { data: kycSubmission } = await supabase
    .from("kyc_submissions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete your Know Your Customer verification to invest in properties
          personally
        </p>
      </div>

      {/* KYC Status Overview */}
      <KYCStatusCard kycSubmission={kycSubmission} />

      {/* KYC Form or Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KYC Application
          </CardTitle>
          <CardDescription>
            {!kycSubmission
              ? "Submit your KYC application to start investing in properties"
              : "Your KYC application details"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!kycSubmission ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                To express interest in properties and make investments, you need
                to complete the KYC verification process. This helps us ensure
                compliance with regulatory requirements and protects your
                investments.
              </p>
              <KYCForm
                onSubmit={async (data, files) => {
                  // Handle form submission
                  console.log("KYC Form submitted:", data, files);
                }}
                onCancel={() => {
                  // Handle form cancellation
                  console.log("KYC Form cancelled");
                }}
              />
            </div>
          ) : kycSubmission.status === "pending" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Application Under Review</span>
              </div>
              <p className="text-muted-foreground">
                Your KYC application was submitted on{" "}
                {formatDate(kycSubmission.created_at)} and is currently being
                reviewed by our team. This process typically takes 2-3 business
                days.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Application Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buyer Type:</span>
                    <span className="capitalize">
                      {kycSubmission.buyer_type}
                    </span>
                  </div>
                  {kycSubmission.full_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Full Name:</span>
                      <span>{kycSubmission.full_name}</span>
                    </div>
                  )}
                  {kycSubmission.company_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Company Name:
                      </span>
                      <span>{kycSubmission.company_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{kycSubmission.email_address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{kycSubmission.phone_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Application Fee:
                    </span>
                    <span
                      className={
                        kycSubmission.application_fee_paid
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {kycSubmission.application_fee_paid ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : kycSubmission.status === "approved" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">KYC Approved</span>
              </div>
              <p className="text-muted-foreground">
                Your KYC application has been approved! You can now express
                interest in properties and start making investments.
              </p>
              {kycSubmission.reviewed_at && (
                <p className="text-sm text-muted-foreground">
                  Approved on {formatDate(kycSubmission.reviewed_at)}
                </p>
              )}
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/(main)/properties">Browse Properties</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/my-interests">View My Interests</Link>
                </Button>
              </div>
            </div>
          ) : kycSubmission.status === "rejected" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">KYC Rejected</span>
              </div>
              <p className="text-muted-foreground">
                Your KYC application has been rejected. Please review the admin
                notes below and submit a new application.
              </p>
              {kycSubmission.admin_notes && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">
                    Admin Notes:
                  </h4>
                  <p className="text-red-700">{kycSubmission.admin_notes}</p>
                </div>
              )}
              <Button>Submit New Application</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Revision Required</span>
              </div>
              <p className="text-muted-foreground">
                Your KYC application needs revision. Please review the admin
                notes and update your submission.
              </p>
              {kycSubmission.admin_notes && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">
                    Admin Notes:
                  </h4>
                  <p className="text-orange-700">{kycSubmission.admin_notes}</p>
                </div>
              )}
              <Button>Update Application</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Required Documents</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • Government-issued ID (passport, driver's license, or
                  national ID)
                </li>
                <li>
                  • Proof of address (utility bill or bank statement, not older
                  than 3 months)
                </li>
                <li>• For companies: Business registration documents</li>
                <li>• Application fee payment proof</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Processing Time</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Initial review: 2-3 business days</li>
                <li>
                  • Additional verification (if needed): 1-2 business days
                </li>
                <li>
                  • You'll receive email notifications about status updates
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
