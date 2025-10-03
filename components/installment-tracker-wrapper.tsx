"use client";

import { InstallmentTracker } from "@/components/installment-tracker";
import { InstallmentPayment } from "@/lib/types";

interface InstallmentTrackerWrapperProps {
  installments: InstallmentPayment[];
}

export function InstallmentTrackerWrapper({
  installments,
}: InstallmentTrackerWrapperProps) {
  const handlePaymentUpload = (installmentId: string) => {
    console.log("Upload payment for:", installmentId);
    // TODO: Implement payment upload logic
  };

  const handleViewDetails = (installmentId: string) => {
    console.log("View details for:", installmentId);
    // TODO: Implement view details logic
  };

  return (
    <InstallmentTracker
      installments={installments}
      onPaymentUpload={handlePaymentUpload}
      onViewDetails={handleViewDetails}
    />
  );
}
