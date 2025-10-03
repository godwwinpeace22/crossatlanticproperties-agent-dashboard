"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Eye,
} from "lucide-react";
import { InstallmentPayment, InstallmentStatus } from "@/lib/types";

interface InstallmentTrackerProps {
  installments: InstallmentPayment[];
  onPaymentUpload?: (installmentId: string) => void;
  onViewDetails?: (installmentId: string) => void;
}

const getStatusInfo = (status: InstallmentStatus) => {
  switch (status) {
    case "paid":
      return {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        badgeClass: "bg-green-500 hover:bg-green-600 text-white",
        label: "Paid",
      };
    case "pending":
      return {
        icon: Clock,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        badgeClass: "bg-blue-500 hover:bg-blue-600 text-white",
        label: "Pending",
      };
    case "overdue":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        badgeClass: "bg-red-500 hover:bg-red-600 text-white",
        label: "Overdue",
      };
    case "waived":
      return {
        icon: CheckCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        badgeClass: "bg-gray-500 hover:bg-gray-600 text-white",
        label: "Waived",
      };
    default:
      return {
        icon: Clock,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        badgeClass: "bg-gray-500 hover:bg-gray-600 text-white",
        label: "Unknown",
      };
  }
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

const isOverdue = (dueDate: string) => {
  return (
    new Date(dueDate) < new Date() &&
    new Date(dueDate).toDateString() !== new Date().toDateString()
  );
};

const getDaysUntilDue = (dueDate: string) => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export function InstallmentTracker({
  installments,
  onPaymentUpload,
  onViewDetails,
}: InstallmentTrackerProps) {
  const totalAmount = installments.reduce(
    (sum, installment) => sum + installment.amount,
    0
  );
  const paidAmount = installments.reduce(
    (sum, installment) =>
      sum + (installment.status === "paid" ? installment.paid_amount : 0),
    0
  );
  const progressPercentage =
    totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const paidCount = installments.filter((i) => i.status === "paid").length;
  const overdueCount = installments.filter(
    (i) =>
      i.status === "overdue" ||
      (i.status === "pending" && isOverdue(i.due_date))
  ).length;

  return (
    <div className="space-y-6">
      {/* Payment Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Progress
          </CardTitle>
          <CardDescription>
            Track your installment payments and overall progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {installments.length}
              </div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {paidCount}
              </div>
              <div className="text-xs text-gray-600">Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {overdueCount}
              </div>
              <div className="text-xs text-gray-600">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatPrice(paidAmount)}
              </div>
              <div className="text-xs text-gray-600">Paid Amount</div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <div className="font-semibold">Total Amount</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(totalAmount)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">Remaining</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatPrice(totalAmount - paidAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installment List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Payment Schedule</h3>
        {installments.map((installment) => {
          const statusInfo = getStatusInfo(installment.status);
          const Icon = statusInfo.icon;
          const daysUntilDue = getDaysUntilDue(installment.due_date);
          const isInstallmentOverdue =
            isOverdue(installment.due_date) && installment.status === "pending";

          return (
            <Card
              key={installment.id}
              className={`${
                isInstallmentOverdue
                  ? "border-red-300 bg-red-50"
                  : statusInfo.borderColor
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                      <Icon className={`h-4 w-4 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold">
                        Installment #{installment.installment_number}
                      </div>
                      <div className="text-sm text-gray-600">
                        Due:{" "}
                        {new Date(installment.due_date).toLocaleDateString()}
                      </div>
                      {daysUntilDue > 0 && installment.status === "pending" && (
                        <div className="text-xs text-blue-600">
                          {daysUntilDue} days remaining
                        </div>
                      )}
                      {isInstallmentOverdue && (
                        <div className="text-xs text-red-600 font-medium">
                          {Math.abs(daysUntilDue)} days overdue
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatPrice(installment.amount)}
                    </div>
                    <Badge className={statusInfo.badgeClass}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {/* Payment Details */}
                {installment.status === "paid" && (
                  <div className="mt-4 pt-4 border-t bg-green-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <div className="font-medium text-green-800">
                          Paid: {formatPrice(installment.paid_amount)}
                        </div>
                        {installment.payment_date && (
                          <div className="text-green-700">
                            on{" "}
                            {new Date(
                              installment.payment_date
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {installment.payment_method && (
                        <div className="text-green-700">
                          via {installment.payment_method}
                        </div>
                      )}
                    </div>
                    {installment.transaction_reference && (
                      <div className="text-xs text-green-600 mt-2">
                        Ref: {installment.transaction_reference}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  {installment.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => onPaymentUpload?.(installment.id)}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Payment Proof
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails?.(installment.id)}
                    className={installment.status === "pending" ? "" : "flex-1"}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>

                {/* Admin Processing Status */}
                {installment.payment_proof_url &&
                  installment.status === "pending" && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-yellow-800">
                        <Clock className="h-4 w-4" />
                        Payment proof submitted - awaiting admin verification
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {installments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-semibold text-lg mb-2">
              No Installments Found
            </h3>
            <p className="text-gray-600">
              Your payment schedule will appear here once your property interest
              is approved.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
