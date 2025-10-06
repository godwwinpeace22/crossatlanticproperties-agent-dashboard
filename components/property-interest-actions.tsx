"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PropertyInterestActionsProps {
  interestId: string;
  currentStatus: string;
  propertyPrice?: number;
  selectedPaymentPlan?: string;
}

export function PropertyInterestActions({
  interestId,
  currentStatus,
  propertyPrice,
  selectedPaymentPlan,
}: PropertyInterestActionsProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsProcessing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update property interest status
      const { error: updateError } = await supabase
        .from("property_interests")
        .update({
          status: "approved",
          admin_notes: adminNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", interestId);

      if (updateError) throw updateError;

      // Create installment schedule
      if (propertyPrice && selectedPaymentPlan) {
        await createInstallmentSchedule(
          interestId,
          propertyPrice,
          selectedPaymentPlan
        );
      }

      // Get the property interest details to create notification
      const { data: interest } = await supabase
        .from("property_interests")
        .select("user_id, property:properties(name)")
        .eq("id", interestId)
        .single();

      // Create notification for the user
      if (interest) {
        const propertyName = Array.isArray(interest.property)
          ? interest.property[0]?.name
          : (interest.property as any)?.name;

        await supabase.from("notifications").insert({
          user_id: interest.user_id,
          type: "interest_approved",
          title: "Property Interest Approved",
          message: `Your interest in ${propertyName} has been approved. Your payment schedule has been created.`,
          property_interest_id: interestId,
        });
      }

      toast({
        title: "Interest Approved",
        description:
          "The property interest has been approved and payment schedule created.",
      });

      setShowApproveDialog(false);
      router.refresh();
    } catch (error) {
      console.error("Error approving interest:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to approve property interest",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update property interest status
      const { error: updateError } = await supabase
        .from("property_interests")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", interestId);

      if (updateError) throw updateError;

      // Get the property interest details to create notification
      const { data: interest } = await supabase
        .from("property_interests")
        .select("user_id, property:properties(name)")
        .eq("id", interestId)
        .single();

      // Create notification for the user
      if (interest) {
        const propertyName = Array.isArray(interest.property)
          ? interest.property[0]?.name
          : (interest.property as any)?.name;

        await supabase.from("notifications").insert({
          user_id: interest.user_id,
          type: "interest_rejected",
          title: "Property Interest Rejected",
          message: `Your interest in ${propertyName} has been rejected. ${
            adminNotes || "Please contact support for details."
          }`,
          property_interest_id: interestId,
        });
      }

      toast({
        title: "Interest Rejected",
        description: "The property interest has been rejected.",
      });

      setShowRejectDialog(false);
      router.refresh();
    } catch (error) {
      console.error("Error rejecting interest:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reject property interest",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const createInstallmentSchedule = async (
    propertyInterestId: string,
    propertyPrice: number,
    selectedPaymentPlan: string
  ) => {
    let installments: Array<{
      installment_number: number;
      amount: number;
      due_date: Date;
    }> = [];
    const baseDate = new Date();

    switch (selectedPaymentPlan) {
      case "full":
        installments = [
          {
            installment_number: 1,
            amount: propertyPrice,
            due_date: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        ];
        break;

      case "30-30-40":
        const amount30 = propertyPrice * 0.3;
        const amount40 = propertyPrice * 0.4;
        installments = [
          {
            installment_number: 1,
            amount: amount30,
            due_date: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            installment_number: 2,
            amount: amount30,
            due_date: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000),
          },
          {
            installment_number: 3,
            amount: amount40,
            due_date: new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
        ];
        break;

      case "25x4":
        const amount25 = propertyPrice * 0.25;
        installments = Array.from({ length: 4 }, (_, i) => ({
          installment_number: i + 1,
          amount: amount25,
          due_date: new Date(
            baseDate.getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000
          ),
        }));
        break;
    }

    // Insert installment payments
    const installmentData = installments.map((installment) => ({
      property_interest_id: propertyInterestId,
      installment_number: installment.installment_number,
      amount: installment.amount,
      due_date: installment.due_date.toISOString(),
      status: "pending" as const,
    }));

    const { error } = await supabase
      .from("installment_payments")
      .insert(installmentData);

    if (error) throw error;
  };

  // Only show actions if the status is pending
  if (currentStatus !== "pending") {
    return null;
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowRejectDialog(true)}
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
        <Button size="sm" onClick={() => setShowApproveDialog(true)}>
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Property Interest</DialogTitle>
            <DialogDescription>
              This will approve the property interest and create an installment
              payment schedule for the buyer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add any notes about this approval..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve Interest
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property Interest</DialogTitle>
            <DialogDescription>
              This will reject the property interest. The buyer will be notified
              of the rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">
                Rejection Reason (Optional but recommended)
              </Label>
              <Textarea
                id="reject-notes"
                placeholder="Please provide a reason for rejection..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject Interest
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
