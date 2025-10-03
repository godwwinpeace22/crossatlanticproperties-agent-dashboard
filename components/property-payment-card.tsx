"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  MapPin,
  Home,
  ChevronDown,
  CheckCircle,
  Clock,
  Upload,
  AlertTriangle,
  Loader2,
  WalletMinimal,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface PropertyPaymentCardProps {
  property: any;
  payments: any[];
}

export function PropertyPaymentCard({
  property,
  payments,
}: PropertyPaymentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const totalDue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const progressPercentage = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
  const paidCount = payments.filter((p) => p.status === "paid").length;

  const handleUploadProof = (payment: any) => {
    setSelectedPayment(payment);
    setPaidAmount(payment.amount.toString());
    setTransactionRef("");
    setPaymentMethod("");
    setPaymentProof(null);
  };

  const handleSubmitProof = async () => {
    if (!selectedPayment) return;

    setIsUploading(true);

    try {
      let proofUrl = null;

      if (paymentProof) {
        const fileExt = paymentProof.name.split(".").pop();
        const fileName = `${selectedPayment.id}-${Date.now()}.${fileExt}`;
        const filePath = `payment-proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, paymentProof);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);

        proofUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from("installment_payments")
        .update({
          payment_proof_url: proofUrl,
          transaction_reference: transactionRef,
          payment_method: paymentMethod,
          paid_amount: Number(paidAmount),
          status: "pending_verification",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPayment.id);

      if (updateError) throw updateError;

      setSelectedPayment(null);
      router.refresh();
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      alert("Failed to upload payment proof. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getPaymentStatusBadge = (payment: any) => {
    if (payment.status === "paid") {
      return (
        <Badge className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    }

    if (payment.status === "pending_verification") {
      return (
        <Badge className="rounded bg-orange-500/10 border-orange-500 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
          <Clock className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      );
    }

    const isOverdue = new Date(payment.due_date) < new Date();
    if (isOverdue) {
      return (
        <Badge className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    return (
      <Badge className="rounded bg-muted/10 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <>
      <Card className="overflow-hidden border py-0 border-border/50 bg-card gap-0 transition-shadow hover:shadow-sm">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-100 bg-muted/20 p-4"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>{property.category || property.type}</span>
              <span className="text-border">•</span>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{property.city}</span>
            </div>
            <h3 className="text-base font-semibold leading-tight text-foreground">
              {property.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <WalletMinimal className="h-3.5 w-3.5 shrink-0" />
              <span>
                {paidCount}/{payments.length} installments paid •{" "}
                {formatCurrency(totalPaid)} paid
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative h-12 w-12">
              <svg className="h-12 w-12 -rotate-90 transform">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={progressPercentage === 100 ? "green" : "blue"}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 20 * (1 - progressPercentage / 100)
                  }`}
                  className="text-primary transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                {Math.round(progressPercentage)}%
              </div>
            </div>

            <button className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-4">
          <div
            className={`grid transition-all duration-200 ${
              isExpanded
                ? "grid-rows-[1fr] opacity-100 py-4"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-3">
                {/* <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 bg-green-500/5 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Paid
                    </div>
                    <div className="mt-1 text-sm font-bold text-foreground">
                      {formatCurrency(totalPaid)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-blue-500/5 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Remaining
                    </div>
                    <div className="mt-1 text-sm font-bold text-foreground">
                      {formatCurrency(totalDue - totalPaid)}
                    </div>
                  </div>
                </div> */}

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Payment Schedule
                  </div>
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                          #{payment.installment_number}
                        </div>
                        <div className="min-w-0">
                          {getPaymentStatusBadge(payment)}
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDate(payment.due_date)}
                            {payment.status === "paid" &&
                              payment.payment_date && (
                                <span className="text-green-600 font-medium ml-1">
                                  • Paid {formatDate(payment.payment_date)}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-sm font-bold text-foreground text-right">
                          {formatCurrency(Number(payment.amount))}
                        </div>
                        {payment.status !== "paid" &&
                          payment.status !== "pending_verification" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleUploadProof(payment)}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Upload
                            </Button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Payment Proof Dialog */}
      <Dialog
        open={!!selectedPayment}
        onOpenChange={() => setSelectedPayment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Payment Proof</DialogTitle>
            <DialogDescription>
              Submit proof of payment for Installment #
              {selectedPayment?.installment_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Enter amount paid"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transaction Reference</Label>
              <Input
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter transaction reference number"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Proof (Receipt/Screenshot)</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Upload a receipt, bank statement, or screenshot as proof
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedPayment(null)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitProof}
              disabled={isUploading || !paymentMethod || !paidAmount}
            >
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit for Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
