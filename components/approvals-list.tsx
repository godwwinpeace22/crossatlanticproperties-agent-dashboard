"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, DollarSign, User, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  property_id: string;
  buyer_email: string;
  buyer_name: string;
  amount: string;
  status: string;
  notes: string | null;
  created_at: string;
  properties: {
    name: string;
    price: string;
  };
  submitter: {
    full_name: string | null;
    email: string;
  };
}

interface ApprovalsListProps {
  submissions: Submission[];
}

export function ApprovalsList({ submissions }: ApprovalsListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const supabase = createClient();

  const handleApproval = async (
    submissionId: string,
    action: "approved" | "rejected"
  ) => {
    setProcessingId(submissionId);

    try {
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) throw new Error("Submission not found");

      // Update submission status
      const { error: updateError } = await supabase
        .from("payment_submissions")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          notes: reviewNotes[submissionId] || null,
        })
        .eq("id", submissionId);

      if (updateError) throw updateError;

      if (action === "approved") {
        // Get buyer profile
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", submission.buyer_email)
          .single();

        if (!buyerProfile) throw new Error("Buyer profile not found");

        // Get submitter profile
        const { data: submitterProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", submission.submitter.email)
          .single();

        if (!submitterProfile) throw new Error("Submitter profile not found");

        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabase
          .from("purchases")
          .insert([
            {
              property_id: submission.property_id,
              buyer_id: buyerProfile.id,
              seller_id: submitterProfile.id,
              amount: Number.parseFloat(submission.amount),
              submission_id: submissionId,
            },
          ])
          .select()
          .single();

        if (purchaseError) throw purchaseError;

        // Create agent hierarchy relationship
        const { error: hierarchyError } = await supabase
          .from("agent_hierarchy")
          .insert([
            {
              agent_id: buyerProfile.id,
              upline_id: submitterProfile.id,
              level: 1,
              approved: true,
              approved_at: new Date().toISOString(),
            },
          ]);

        if (hierarchyError) throw hierarchyError;

        // Calculate and create commissions
        await calculateCommissions(
          purchase.id,
          submitterProfile.id,
          Number.parseFloat(submission.amount)
        );
      }

      router.refresh();
    } catch (error) {
      console.error("Error processing approval:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const calculateCommissions = async (
    purchaseId: string,
    sellerId: string,
    amount: number
  ) => {
    // Get commission settings
    const { data: commissionSettings } = await supabase
      .from("commission_settings")
      .select("*")
      .order("level");

    if (!commissionSettings) return;

    // Get upline chain
    const uplineChain = await getUplineChain(sellerId);

    // console.log({ uplineChain, sellerId, amount, purchaseId });

    // Create commission records for each level
    const commissionPromises = uplineChain.map(async (uplineAgent, index) => {
      const level = index + 1;
      const commissionSetting = commissionSettings.find(
        (cs) => cs.level === level
      );

      // console.log({ level, uplineAgent, commissionSetting });

      if (commissionSetting) {
        const commissionAmount =
          (amount * Number(commissionSetting.percentage)) / 100;

        return supabase.from("commissions").insert([
          {
            agent_id: uplineAgent.id,
            purchase_id: purchaseId,
            amount: commissionAmount,
            percentage: Number(commissionSetting.percentage),
            level: level,
          },
        ]);
      }
    });

    await Promise.all(commissionPromises.filter(Boolean));
  };

  const getUplineChain = async (
    agentId: string
  ): Promise<Array<{ id: string }>> => {
    const uplineChain: Array<{ id: string }> = [];
    let currentAgentId = agentId;

    // Traverse up the hierarchy (max 5 levels as per commission settings)
    for (let i = 0; i < 5; i++) {
      const { data: hierarchy, error } = await supabase
        .from("agent_hierarchy")
        .select("upline_id")
        .eq("agent_id", currentAgentId)
        .eq("approved", true)
        .limit(1);

      if (error) {
        break;
      }

      if (hierarchy && hierarchy.length > 0 && hierarchy[0].upline_id) {
        uplineChain.push({ id: hierarchy[0].upline_id });
        currentAgentId = hierarchy[0].upline_id;
      } else {
        break;
      }
    }

    return uplineChain;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const processedSubmissions = submissions.filter(
    (s) => s.status !== "pending"
  );

  return (
    <div className="space-y-6">
      {pendingSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Pending Approvals ({pendingSubmissions.length})
          </h2>
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => (
              <Card key={submission.id} className="border-orange-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {submission.properties.name}
                      </CardTitle>
                      <CardDescription>
                        Submitted by:{" "}
                        {submission.submitter.full_name ||
                          submission.submitter.email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Buyer</p>
                        <p className="font-semibold">{submission.buyer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.buyer_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-semibold">
                          ${Number(submission.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Submitted
                        </p>
                        <p className="font-semibold">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {submission.notes && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground mb-1">
                        Submission Notes:
                      </p>
                      <p className="text-sm">{submission.notes}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${submission.id}`}>
                      Review Notes (Optional)
                    </Label>
                    <Textarea
                      id={`notes-${submission.id}`}
                      value={reviewNotes[submission.id] || ""}
                      onChange={(e) =>
                        setReviewNotes({
                          ...reviewNotes,
                          [submission.id]: e.target.value,
                        })
                      }
                      placeholder="Add notes about your decision..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproval(submission.id, "approved")}
                      disabled={processingId === submission.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {processingId === submission.id
                        ? "Processing..."
                        : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleApproval(submission.id, "rejected")}
                      disabled={processingId === submission.id}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {processedSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Decisions</h2>
          <div className="space-y-4">
            {processedSubmissions.slice(0, 10).map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {submission.properties.name}
                      </CardTitle>
                      <CardDescription>
                        {submission.buyer_name} - $
                        {Number(submission.amount).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {submissions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Check className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No submissions to review
            </h3>
            <p className="text-muted-foreground text-center">
              All payment submissions have been processed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
