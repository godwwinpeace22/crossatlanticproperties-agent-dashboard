"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Check, X, FileText, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/format";
import { KYCSubmission } from "@/lib/types";

interface KYCSubmissionWithProfile extends KYCSubmission {
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface KYCDetailsFormProps {
  submission: KYCSubmissionWithProfile;
  onClose: () => void;
}

export function KYCDetailsForm({ submission, onClose }: KYCDetailsFormProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Helper function to get proper document URL
  const getDocumentUrl = (url: string | null) => {
    if (!url) return null;

    // If it's already a full URL, return as is
    if (url.startsWith("http")) {
      return url;
    }

    // If it's a storage path, get signed URL
    try {
      const { data } = supabase.storage.from("documents").getPublicUrl(url);
      return data.publicUrl;
    } catch (error) {
      console.error("Error getting document URL:", error);
      return null;
    }
  };

  const handleStatusUpdate = async (
    submissionId: string,
    newStatus: "approved" | "rejected" | "needs_revision"
  ) => {
    setProcessingId(submissionId);

    try {
      const { error } = await supabase
        .from("kyc_submissions")
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      if (error) throw error;

      // Create notification for the user
      await supabase.from("notifications").insert({
        user_id: submission.user_id,
        type: "kyc_status",
        title: `KYC ${
          newStatus === "approved"
            ? "Approved"
            : newStatus === "rejected"
            ? "Rejected"
            : "Revision Required"
        }`,
        message:
          newStatus === "approved"
            ? "Your KYC application has been approved. You can now express interest in properties."
            : newStatus === "rejected"
            ? `Your KYC application has been rejected. ${
                adminNotes || "Please contact support for details."
              }`
            : `Your KYC application needs revision. ${
                adminNotes || "Please update your submission."
              }`,
        kyc_submission_id: submissionId,
      });

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error updating KYC status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const getApplicationFeeStatus = (submission: KYCSubmissionWithProfile) => {
    if (submission.application_fee_approved) {
      return <Badge className="bg-green-500">Fee Approved</Badge>;
    } else if (submission.application_fee_paid) {
      return <Badge variant="secondary">Fee Paid - Pending Review</Badge>;
    } else {
      return <Badge variant="outline">Fee Pending</Badge>;
    }
  };

  return (
    <>
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Buyer Type</Label>
                <p className="capitalize">{submission.buyer_type}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Application Date</Label>
                <p>{formatDate(submission.created_at)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  {submission.buyer_type === "individual"
                    ? "Full Name"
                    : "Company Name"}
                </Label>
                <p>
                  {submission.buyer_type === "individual"
                    ? submission.full_name
                    : submission.company_name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email Address</Label>
                <p>{submission.email_address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <p>{submission.phone_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p>{submission.address}</p>
              </div>
            </div>

            {submission.buyer_type === "individual" ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date of Birth</Label>
                  <p>
                    {submission.date_of_birth
                      ? formatDate(submission.date_of_birth)
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Nationality</Label>
                  <p>{submission.nationality || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Occupation</Label>
                  <p>{submission.occupation || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Annual Income</Label>
                  <p>
                    {submission.annual_income
                      ? formatCurrency(submission.annual_income)
                      : "Not provided"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Incorporation Date
                  </Label>
                  <p>
                    {submission.incorporation_date
                      ? formatDate(submission.incorporation_date)
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Country of Incorporation
                  </Label>
                  <p>{submission.country_of_incorporation || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Nature of Business
                  </Label>
                  <p>{submission.nature_of_business || "Not provided"}</p>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Investment Source</Label>
              <p>{submission.investment_source || "Not provided"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submission.government_id_url && (
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Government ID</span>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={getDocumentUrl(submission.government_id_url) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </a>
                </Button>
              </div>
            )}

            {submission.proof_of_address_url && (
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Proof of Address</span>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={
                      getDocumentUrl(submission.proof_of_address_url) || "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </a>
                </Button>
              </div>
            )}

            {submission.business_documents_urls &&
              submission.business_documents_urls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Business Documents
                  </Label>
                  {submission.business_documents_urls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Business Document {index + 1}</span>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={getDocumentUrl(url) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

            {submission.application_fee_payment_proof && (
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Application Fee Payment Proof</span>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={
                      getDocumentUrl(
                        submission.application_fee_payment_proof
                      ) || "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Fee Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Fee Amount</Label>
                <p>{formatCurrency(submission.application_fee_amount)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Payment Status</Label>
                <div className="mt-1">
                  {getApplicationFeeStatus(submission)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.admin_notes && (
              <div>
                <Label className="text-sm font-medium">Previous Notes</Label>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {submission.admin_notes}
                </p>
              </div>
            )}

            {submission.status === "pending" && (
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Add Notes (optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes about this KYC application..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DialogFooter className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {submission.status === "pending" && (
          <>
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate(submission.id, "rejected")}
              disabled={processingId === submission.id}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                handleStatusUpdate(submission.id, "needs_revision")
              }
              disabled={processingId === submission.id}
            >
              <FileText className="h-4 w-4 mr-1" />
              Request Revision
            </Button>
            <Button
              onClick={() => handleStatusUpdate(submission.id, "approved")}
              disabled={processingId === submission.id}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}
