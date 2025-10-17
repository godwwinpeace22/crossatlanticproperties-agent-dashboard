"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getDocumentViewUrl } from "@/lib/document-upload";

interface PaymentApprovalListProps {
  payments: any[];
  interestId: string;
}

export function PaymentApprovalList({
  payments,
  interestId,
}: PaymentApprovalListProps) {
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAction = async (
    payment: any,
    actionType: "approve" | "reject"
  ) => {
    setSelectedPayment(payment);
    setAction(actionType);
    setNotes("");
  };

  const handleConfirm = async () => {
    if (!selectedPayment || !action) return;

    setIsProcessing(true);

    try {
      const newStatus = action === "approve" ? "paid" : "pending";

      const { error } = await supabase
        .from("installment_payments")
        .update({
          status: newStatus,
          payment_date: action === "approve" ? new Date().toISOString() : null,
          admin_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      // If approved, check if all payments are complete and disburse commissions
      if (action === "approve") {
        await checkAndDisburseCommissions();
      }

      // Close dialog and refresh
      setSelectedPayment(null);
      setAction(null);
      setNotes("");
      router.refresh();
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Failed to update payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const checkAndDisburseCommissions = async () => {
    try {
      // Get property interest details
      const { data: interest, error: interestError } = await supabase
        .from("property_interests")
        .select(
          `
          *,
          referring_agent:profiles!property_interests_referring_agent_id_fkey(id, email),
          property:properties(price)
        `
        )
        .eq("id", interestId)
        .single();

      if (interestError || !interest) {
        console.error("Error fetching property interest:", interestError);
        return;
      }

      // Get all installment payments for this interest
      const { data: allPayments, error: paymentsError } = await supabase
        .from("installment_payments")
        .select("*")
        .eq("property_interest_id", interestId);

      if (paymentsError || !allPayments) {
        console.error("Error fetching payments:", paymentsError);
        return;
      }

      // Check if all payments are completed
      const allPaid = allPayments.every((p) => p.status === "paid");

      if (!allPaid) {
        console.log("Not all payments completed yet");
        return;
      }

      // Check if commissions have already been disbursed
      const { data: existingCommissions, error: commissionsCheckError } =
        await supabase
          .from("commissions")
          .select("id")
          .eq("property_interest_id", interestId)
          .limit(1);

      if (commissionsCheckError) {
        console.error(
          "Error checking existing commissions:",
          commissionsCheckError
        );
        return;
      }

      if (existingCommissions && existingCommissions.length > 0) {
        console.log("Commissions already disbursed for this property interest");
        return;
      }

      // Update property interest status to completed
      await supabase
        .from("property_interests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", interestId);

      // Calculate and create commissions if there's a referring agent
      if (interest.referring_agent_id && interest.referring_agent) {
        // Create agent hierarchy relationship (buyer becomes agent under referring agent)
        await createAgentHierarchy(
          interest.user_id,
          interest.referring_agent_id
        );

        const propertyPrice = Number(interest.property?.price || 0);
        await calculateCommissions(
          interestId,
          interest.referring_agent.id,
          propertyPrice
        );
        console.log("Commissions disbursed successfully");
      }
    } catch (error) {
      console.error("Error in checkAndDisburseCommissions:", error);
    }
  };

  const createAgentHierarchy = async (
    buyerId: string,
    referringAgentId: string
  ) => {
    try {
      // Check if hierarchy relationship already exists
      const { data: existingHierarchy } = await supabase
        .from("agent_hierarchy")
        .select("id")
        .eq("agent_id", buyerId)
        .eq("upline_id", referringAgentId)
        .single();

      if (existingHierarchy) {
        console.log("Agent hierarchy already exists for this relationship");
        return;
      }

      // Create the hierarchy relationship
      const { error: hierarchyError } = await supabase
        .from("agent_hierarchy")
        .insert([
          {
            agent_id: buyerId,
            upline_id: referringAgentId,
            level: 1,
            approved: true,
            approved_at: new Date().toISOString(),
          },
        ]);

      if (hierarchyError) {
        console.error("Error creating agent hierarchy:", hierarchyError);
        return;
      }

      console.log("Agent hierarchy created successfully:", {
        buyer: buyerId,
        upline: referringAgentId,
      });
    } catch (error) {
      console.error("Error in createAgentHierarchy:", error);
    }
  };

  const calculateCommissions = async (
    propertyInterestId: string,
    referringAgentId: string,
    amount: number
  ) => {
    try {
      // Get commission settings
      const { data: commissionSettings, error: settingsError } = await supabase
        .from("commission_settings")
        .select("*")
        .order("level");

      if (settingsError || !commissionSettings) {
        console.error("Error fetching commission settings:", settingsError);
        return;
      }

      // Get upline chain
      const uplineChain = await getUplineChain(referringAgentId);

      // Create commission records for each level
      const commissionPromises = uplineChain.map(async (uplineAgent, index) => {
        const level = index + 1;
        const commissionSetting = commissionSettings.find(
          (cs) => cs.level === level
        );

        if (commissionSetting) {
          const commissionAmount =
            (amount * Number(commissionSetting.percentage)) / 100;

          return supabase.from("commissions").insert([
            {
              agent_id: uplineAgent.id,
              property_interest_id: propertyInterestId,
              amount: commissionAmount,
              percentage: Number(commissionSetting.percentage),
              level: level,
            },
          ]);
        }
      });

      await Promise.all(commissionPromises.filter(Boolean));
    } catch (error) {
      console.error("Error calculating commissions:", error);
    }
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

  const getStatusBadge = (payment: any) => {
    if (payment.status === "paid") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    }

    if (payment.status === "pending_verification") {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }

    const isOverdue = new Date(payment.due_date) < new Date();
    if (isOverdue && payment.status === "pending") {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    return (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const openDocumentLink = async (document: any) => {
    const url = await getDocumentViewUrl(document?.file_path);

    window.open(url, "_blank");
  };

  return (
    <>
      <div className="rounded-md border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead>Installment</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    #{payment.installment_number}
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatCurrency(Number(payment.amount))}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(payment.due_date)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment)}</TableCell>
                  <TableCell className="text-sm capitalize">
                    {payment.payment_method?.replace(/_/g, " ") || "—"}
                  </TableCell>
                  <TableCell>
                    {payment.user_document ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => openDocumentLink(payment?.user_document)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === "pending_verification" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleAction(payment, "approve")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleAction(payment, "reject")}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : payment.status === "paid" ? (
                      <Badge variant="outline" className="text-xs">
                        Approved
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Awaiting proof
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedPayment && !!action}
        onOpenChange={() => {
          setSelectedPayment(null);
          setAction(null);
          setNotes("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Payment" : "Reject Payment"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Mark this payment as approved and paid?"
                : "Reject this payment submission?"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Payment Details:</div>
              <div className="text-sm text-muted-foreground">
                Installment #{selectedPayment?.installment_number} •{" "}
                {formatCurrency(Number(selectedPayment?.amount || 0))}
              </div>
              {selectedPayment?.transaction_reference && (
                <div className="text-sm text-muted-foreground">
                  Ref: {selectedPayment.transaction_reference}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or comments..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPayment(null);
                setAction(null);
                setNotes("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isProcessing
                ? "Processing..."
                : `Confirm ${action === "approve" ? "Approval" : "Rejection"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
