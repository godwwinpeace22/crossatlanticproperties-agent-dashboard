"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { InstallmentTracker } from "@/components/installment-tracker";

interface PaymentScheduleSectionProps {
  payments: any[];
}

export function PaymentScheduleSection({
  payments,
}: PaymentScheduleSectionProps) {
  const handlePaymentUpload = (installmentId: string) => {
    console.log("Upload payment for:", installmentId);
    // Add your payment upload logic here
  };

  const handleViewDetails = (installmentId: string) => {
    console.log("View details for:", installmentId);
    // Add your view details logic here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Schedule
        </CardTitle>
        <CardDescription>
          Complete payment history and schedule for all properties
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InstallmentTracker
          installments={payments}
          onPaymentUpload={handlePaymentUpload}
          onViewDetails={handleViewDetails}
        />
      </CardContent>
    </Card>
  );
}
