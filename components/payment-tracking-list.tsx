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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  Eye,
  Calendar,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/format";
import { InstallmentPayment } from "@/lib/types";

interface InstallmentPaymentWithData {
  id: string;
  property_interest_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_amount: number;
  payment_date?: string;
  payment_method?: string;
  transaction_reference?: string;
  payment_proof_url?: string;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;

  property_interest: {
    id: string;
    status: string;
    selected_payment_plan: string;
    profiles: {
      full_name: string | null;
      email: string;
    };
    property: {
      name: string;
      price: number;
      address: string | null;
      city: string | null;
    };
  };
}

interface PaymentTrackingListProps {
  payments: InstallmentPaymentWithData[];
}

export function PaymentTrackingList({ payments }: PaymentTrackingListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] =
    useState<InstallmentPaymentWithData | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const router = useRouter();
  const supabase = createClient();

  // Filter payments based on status
  const filteredPayments = payments.filter((payment) => {
    return statusFilter === "all" || payment.status === statusFilter;
  });

  // Get overdue payments
  const overduePayments = payments.filter(
    (payment) =>
      payment.status === "pending" && new Date(payment.due_date) < new Date()
  );

  const handlePaymentConfirmation = async (
    paymentId: string,
    paidAmount: number
  ) => {
    setProcessingId(paymentId);

    try {
      let paymentProofUrl = null;

      // Upload payment proof if provided
      if (paymentProof) {
        const fileExt = paymentProof.name.split(".").pop();
        const fileName = `payment-proof-${paymentId}.${fileExt}`;
        const filePath = `payment-proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, paymentProof);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);

        paymentProofUrl = publicUrl;
      }

      // Update payment status
      const { error } = await supabase
        .from("installment_payments")
        .update({
          status: "paid",
          paid_amount: paidAmount,
          payment_date: new Date().toISOString(),
          transaction_reference: transactionRef,
          payment_proof_url: paymentProofUrl,
          admin_notes: adminNotes,
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      // Create notification for the user
      const payment = payments.find((p) => p.id === paymentId);
      if (payment) {
        await supabase.from("notifications").insert({
          user_id: payment.property_interest.profiles.email, // This should be user_id, but we need to map it
          type: "payment_confirmed",
          title: "Payment Confirmed",
          message: `Your payment of ${formatCurrency(
            paidAmount
          )} has been confirmed for ${
            payment.property_interest.property.name
          }.`,
          installment_payment_id: paymentId,
        });

        // Check if all payments are complete
        const { data: allPayments } = await supabase
          .from("installment_payments")
          .select("status")
          .eq("property_interest_id", payment.property_interest_id);

        const allPaid = allPayments?.every((p) => p.status === "paid");

        if (allPaid) {
          // Update property interest to completed
          await supabase
            .from("property_interests")
            .update({ status: "completed" })
            .eq("id", payment.property_interest_id);
        }
      }

      router.refresh();
      setPaymentProof(null);
      setTransactionRef("");
      setAdminNotes("");
      setSelectedPayment(null);
    } catch (error) {
      console.error("Error confirming payment:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = status === "pending" && new Date(dueDate) < new Date();

    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case "waived":
        return <Badge variant="secondary">Waived</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const PaymentDetailsModal = ({
    payment,
  }: {
    payment: InstallmentPaymentWithData;
  }) => (
    <Dialog
      open={selectedPayment?.id === payment.id}
      onOpenChange={() => setSelectedPayment(null)}
    >
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Payment Details - Installment #{payment.installment_number}
          </DialogTitle>
          <DialogDescription>
            Confirm payment for{" "}
            {payment.property_interest.profiles.full_name ||
              payment.property_interest.profiles.email}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Installment Number
                  </Label>
                  <p>#{payment.installment_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount Due</Label>
                  <p className="text-lg font-bold">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p
                    className={
                      new Date(payment.due_date) < new Date()
                        ? "text-red-600 font-semibold"
                        : ""
                    }
                  >
                    {formatDate(payment.due_date)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(payment.status, payment.due_date)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property & Buyer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Property & Buyer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Property</Label>
                  <p>{payment.property_interest.property.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(payment.property_interest.property.price)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Buyer</Label>
                  <p>
                    {payment.property_interest.profiles.full_name ||
                      payment.property_interest.profiles.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.property_interest.profiles.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Plan</Label>
                  <p className="capitalize">
                    {payment.property_interest.selected_payment_plan.replace(
                      "-",
                      " "
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Confirmation Form */}
          {payment.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Confirm Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-ref">
                      Transaction Reference
                    </Label>
                    <Input
                      id="transaction-ref"
                      placeholder="Enter transaction reference..."
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-proof">
                      Payment Proof (optional)
                    </Label>
                    <Input
                      id="payment-proof"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) =>
                        setPaymentProof(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add notes about this payment..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {payment.payment_date && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Paid Amount</Label>
                    <p>{formatCurrency(payment.paid_amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Date</Label>
                    <p>{formatDate(payment.payment_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Transaction Reference
                    </Label>
                    <p>{payment.transaction_reference || "Not provided"}</p>
                  </div>
                  {payment.payment_proof_url && (
                    <div>
                      <Label className="text-sm font-medium">
                        Payment Proof
                      </Label>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={payment.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Document
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
                {payment.admin_notes && (
                  <div>
                    <Label className="text-sm font-medium">Admin Notes</Label>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {payment.admin_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedPayment(null)}>
            Close
          </Button>
          {payment.status === "pending" && (
            <Button
              onClick={() =>
                handlePaymentConfirmation(payment.id, payment.amount)
              }
              disabled={processingId === payment.id}
            >
              <Check className="h-4 w-4 mr-1" />
              Confirm Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {payments.filter((p) => p.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overduePayments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payments.filter((p) => p.status === "paid").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alerts */}
      {overduePayments.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Overdue Payments Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              There are {overduePayments.length} overdue payment(s) requiring
              immediate attention.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Payment Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Installment Payments</CardTitle>
          <CardDescription>
            {filteredPayments.length} payment(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Installment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.property_interest.profiles.full_name ||
                            payment.property_interest.profiles.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.property_interest.profiles.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.property_interest.property.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(
                            payment.property_interest.property.price
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          #{payment.installment_number}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({payment.property_interest.selected_payment_plan})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          new Date(payment.due_date) < new Date() &&
                          payment.status === "pending"
                            ? "text-red-600 font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDate(payment.due_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status, payment.due_date)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {payment.status === "pending" ? "Process" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Render modals */}
      {selectedPayment && <PaymentDetailsModal payment={selectedPayment} />}
    </div>
  );
}
