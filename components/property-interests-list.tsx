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
  MapPin,
  Home,
  CreditCard,
  FileText,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/format";
import {
  PropertyInterest,
  Property,
  KYCSubmission,
  InstallmentPayment,
} from "@/lib/types";

interface PropertyInterestWithData {
  id: string;
  user_id: string;
  property_id: string;
  kyc_submission_id?: string;
  status: string;
  selected_payment_plan: string;
  payment_timeframe?: number;
  referral_code?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;

  profiles: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  property: Property;
  kyc_submission?: KYCSubmission;
  installment_payments?: InstallmentPayment[];
}

interface PropertyInterestsListProps {
  interests: PropertyInterestWithData[];
}

export function PropertyInterestsList({
  interests,
}: PropertyInterestsListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] =
    useState<PropertyInterestWithData | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentPlanFilter, setPaymentPlanFilter] = useState<string>("all");
  const router = useRouter();
  const supabase = createClient();

  const filteredInterests = interests.filter((interest) => {
    const statusMatch =
      statusFilter === "all" || interest.status === statusFilter;
    const paymentPlanMatch =
      paymentPlanFilter === "all" ||
      interest.selected_payment_plan === paymentPlanFilter;
    return statusMatch && paymentPlanMatch;
  });

  const handleStatusUpdate = async (
    interestId: string,
    newStatus: "approved" | "rejected" | "withdrawn"
  ) => {
    setProcessingId(interestId);

    try {
      // Update property interest status
      const { error } = await supabase
        .from("property_interests")
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", interestId);

      if (error) throw error;

      // If approved, create installment payments
      if (newStatus === "approved") {
        const interest = interests.find((i) => i.id === interestId);
        if (interest) {
          await createInstallmentSchedule(interestId, interest);
        }
      }

      // Create notification for the user
      const interest = interests.find((i) => i.id === interestId);
      if (interest) {
        await supabase.from("notifications").insert({
          user_id: interest.user_id,
          type:
            newStatus === "approved"
              ? "interest_approved"
              : "interest_rejected",
          title: `Property Interest ${
            newStatus === "approved" ? "Approved" : "Rejected"
          }`,
          message:
            newStatus === "approved"
              ? `Your interest in ${interest.property.name} has been approved. Your payment schedule has been created.`
              : `Your interest in ${
                  interest.property.name
                } has been ${newStatus}. ${
                  adminNotes || "Please contact support for details."
                }`,
          property_interest_id: interestId,
        });
      }

      router.refresh();
      setAdminNotes("");
      setSelectedInterest(null);
    } catch (error) {
      console.error("Error updating property interest:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const createInstallmentSchedule = async (
    propertyInterestId: string,
    interest: PropertyInterestWithData
  ) => {
    const { selected_payment_plan, payment_timeframe } = interest;
    const propertyPrice = interest.property.price;

    let installments: Array<{
      installment_number: number;
      amount: number;
      due_date: Date;
    }> = [];
    const baseDate = new Date();

    switch (selected_payment_plan) {
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

    await supabase.from("installment_payments").insert(installmentData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "withdrawn":
        return <Badge variant="secondary">Withdrawn</Badge>;
      case "completed":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Completed</Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPaymentScheduleSummary = (interest: PropertyInterestWithData) => {
    if (
      !interest.installment_payments ||
      interest.installment_payments.length === 0
    ) {
      return "No payments scheduled";
    }

    const paid = interest.installment_payments.filter(
      (p) => p.status === "paid"
    ).length;
    const total = interest.installment_payments.length;
    const overdue = interest.installment_payments.filter(
      (p) => p.status === "pending" && new Date(p.due_date) < new Date()
    ).length;

    return `${paid}/${total} paid${overdue > 0 ? `, ${overdue} overdue` : ""}`;
  };

  const PropertyInterestDetailsModal = ({
    interest,
  }: {
    interest: PropertyInterestWithData;
  }) => (
    <Dialog
      open={selectedInterest?.id === interest.id}
      onOpenChange={() => setSelectedInterest(null)}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl">
            Property Interest Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Review and manage property interest from{" "}
            <span className="font-medium">
              {interest.profiles.full_name || interest.profiles.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div
          className="overflow-y-auto pr-2 py-4"
          style={{ maxHeight: "calc(85vh - 180px)" }}
        >
          {/* Property Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Property Information
            </h3>
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">
                  Property Name
                </span>
                <span className="font-medium text-right">
                  {interest.property.name}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(interest.property.price)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="text-right max-w-xs">
                  {interest.property.address}, {interest.property.city}
                </span>
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Buyer Information
            </h3>
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Full Name</span>
                <span className="font-medium">
                  {interest.profiles.full_name || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-right">{interest.profiles.email}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span>{interest.profiles.phone || "Not provided"}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">
                  Interest Date
                </span>
                <span>{formatDate(interest.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Payment Plan */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Plan
            </h3>
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">
                  Selected Plan
                </span>
                <span className="font-medium capitalize">
                  {interest.selected_payment_plan.replace("-", " ")}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">
                  Payment Timeframe
                </span>
                <span>{interest.payment_timeframe || "Standard"} months</span>
              </div>
            </div>
          </div>

          {/* KYC Status */}
          {interest.kyc_submission && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                KYC Verification
              </h3>
              <div className="space-y-3 border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div>
                    {interest.kyc_submission.status === "approved" ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Approved
                      </Badge>
                    ) : interest.kyc_submission.status === "pending" ? (
                      <Badge variant="outline">Pending</Badge>
                    ) : (
                      <Badge variant="destructive">Rejected</Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">
                    Buyer Type
                  </span>
                  <span className="capitalize">
                    {interest.kyc_submission.buyer_type}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Schedule */}
          {interest.installment_payments &&
            interest.installment_payments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Payment Schedule
                </h3>
                <div className="border rounded-lg divide-y">
                  {interest.installment_payments.map((payment, index) => (
                    <div key={payment.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-muted-foreground">
                          Installment #{index + 1}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Due: {formatDate(payment.due_date)}
                        </span>
                        <Badge
                          variant={
                            payment.status === "paid" ? "default" : "outline"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Referral Information */}
          {interest.referral_code && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Referral
              </h3>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">
                    Referral Code
                  </span>
                  <code className="font-mono font-semibold">
                    {interest.referral_code}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Admin Review
            </h3>
            <div className="space-y-4">
              {interest.admin_notes && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Previous Notes
                  </p>
                  <p className="text-sm">{interest.admin_notes}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-notes" className="text-sm">
                  Add Review Notes {!interest.admin_notes && "(Optional)"}
                </Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes about this property interest..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[100px]"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          {interest.status === "pending" &&
          interest.kyc_submission?.status === "approved" ? (
            <>
              <Button
                variant="outline"
                onClick={() => setSelectedInterest(null)}
                className="w-full sm:w-auto mr-2"
              >
                Close
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate(interest.id, "rejected")}
                  disabled={processingId === interest.id}
                  className="flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(interest.id, "approved")}
                  disabled={processingId === interest.id}
                  className="flex-1 sm:flex-none"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setSelectedInterest(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Property Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Payment Plan</Label>
              <Select
                value={paymentPlanFilter}
                onValueChange={setPaymentPlanFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="30-30-40">30-30-40%</SelectItem>
                  <SelectItem value="25x4">25% x 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {interests.filter((i) => i.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {interests.filter((i) => i.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {interests.filter((i) => i.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property Interests</CardTitle>
          <CardDescription>
            {filteredInterests.length} interest(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Payment Plan</TableHead>
                  {/* <TableHead>KYC Status</TableHead> */}
                  {/* <TableHead>Payment Progress</TableHead> */}
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterests.map((interest) => (
                  <TableRow key={interest.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {interest.profiles.full_name ||
                            interest.profiles.email}
                        </p>
                        {/* <p className="text-sm text-muted-foreground">
                          {interest.profiles.email}
                        </p> */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-sm">
                        <p className="font-medium">{interest.property.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(interest.property.price)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {interest.selected_payment_plan.replace("-", " ")}
                      </span>
                    </TableCell>
                    {/* <TableCell>
                      {interest.kyc_submission ? (
                        <Badge
                          variant={
                            interest.kyc_submission.status === "approved"
                              ? "default"
                              : "outline"
                          }
                        >
                          {interest.kyc_submission.status}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">No KYC</Badge>
                      )}
                    </TableCell> */}
                    {/* <TableCell>
                      <span className="text-sm">
                        {getPaymentScheduleSummary(interest)}
                      </span>
                    </TableCell> */}
                    <TableCell>{getStatusBadge(interest.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(interest.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedInterest(interest)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
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
      {selectedInterest && (
        <PropertyInterestDetailsModal interest={selectedInterest} />
      )}
    </div>
  );
}
