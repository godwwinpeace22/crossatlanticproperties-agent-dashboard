"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { KYCSubmission, KYCStatus } from "@/lib/types";

interface KYCStatusCardProps {
  kycSubmission?: KYCSubmission | null;
  className?: string;
}

const getStatusInfo = (status: KYCStatus) => {
  switch (status) {
    case "approved":
      return {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        badgeVariant: "default" as const,
        badgeClass: "bg-green-500 hover:bg-green-600",
        title: "KYC Approved",
        description:
          "Your KYC application has been approved. You can now express interest in properties.",
      };
    case "pending":
      return {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        badgeVariant: "secondary" as const,
        badgeClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
        title: "KYC Under Review",
        description:
          "Your KYC application is being reviewed. This process typically takes 2-3 business days.",
      };
    case "rejected":
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        badgeVariant: "destructive" as const,
        badgeClass: "bg-red-500 hover:bg-red-600",
        title: "KYC Rejected",
        description:
          "Your KYC application has been rejected. Please review the admin notes and resubmit.",
      };
    case "needs_revision":
      return {
        icon: AlertCircle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        badgeVariant: "secondary" as const,
        badgeClass: "bg-orange-500 hover:bg-orange-600 text-white",
        title: "Revision Required",
        description:
          "Your KYC application needs revision. Please check the admin notes and update your submission.",
      };
    default:
      return {
        icon: AlertCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        badgeVariant: "secondary" as const,
        badgeClass: "bg-gray-500 hover:bg-gray-600 text-white",
        title: "KYC Status Unknown",
        description: "Unable to determine KYC status.",
      };
  }
};

export function KYCStatusCard({
  kycSubmission,
  className = "",
}: KYCStatusCardProps) {
  if (!kycSubmission) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            No KYC Application
          </CardTitle>
          <CardDescription>
            You haven't submitted a KYC application yet. Complete KYC to express
            interest in properties.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(kycSubmission.status);
  const Icon = statusInfo.icon;

  return (
    <Card className={`py-0 gap-0 ${statusInfo.borderColor} ${className}`}>
      <CardHeader className={`rounded-xl py-3 ${statusInfo.bgColor}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${statusInfo.color}`} />
            {statusInfo.title}
          </CardTitle>
          <Badge className={statusInfo.badgeClass}>
            {kycSubmission.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
        <CardDescription className="text-gray-700">
          {statusInfo.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {/* Basic Information */}
        {/* <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Submitted:</span>
            <div>{new Date(kycSubmission.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Buyer Type:</span>
            <div className="capitalize">{kycSubmission.buyer_type}</div>
          </div>
        </div> */}

        {/* Admin Notes */}
        {kycSubmission.admin_notes && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {kycSubmission.admin_notes}
            </div>
          </div>
        )}

        {/* Review Information */}
        {/* {kycSubmission.reviewed_at && (
          <div className="border-t pt-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Reviewed:</span>{" "}
              {new Date(kycSubmission.reviewed_at).toLocaleDateString()}
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}
