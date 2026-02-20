"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";

export function AdminUserKycActions({
  kycId,
  userId,
  isAgent,
  agentActivated,
  user,
  kycSubmission,
}: {
  kycId: string;
  userId: string;
  isAgent: boolean;
  agentActivated: boolean;
  user: Profile;
  kycSubmission: any;
}) {
  const [loading, setLoading] = useState<
    "approve" | "reject" | "activate" | "deactivate" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAgentActivated, setIsAgentActivated] = useState(agentActivated);

  const handleAction = async (
    action: "approve" | "reject" | "activate" | "deactivate",
  ) => {
    setLoading(action);
    setError(null);
    setSuccess(null);
    try {
      const isActivationAction =
        action === "activate" || action === "deactivate";
      const res = await fetch(
        `/api/admin/kyc/${isActivationAction ? user?.id : kycId}/${action}`,
        {
          method: "POST",
        },
      );
      if (res.ok) {
        setSuccess(
          action === "activate"
            ? "Agent successfully activated"
            : action === "deactivate"
              ? "Agent successfully deactivated"
              : action === "approve"
                ? "KYC approved"
                : "KYC rejected",
        );
        if (action === "activate") {
          setIsAgentActivated(true);
        }
        if (action === "deactivate") {
          setIsAgentActivated(false);
        }
        // window.location.reload();
      } else {
        setError(`Failed to ${action} KYC`);
      }
    } catch (e) {
      setError(`Failed to ${action} KYC`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {kycSubmission?.status === "pending" && (
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          disabled={loading === "approve"}
          onClick={() => handleAction("approve")}
        >
          {loading === "approve" ? "Approving..." : "Approve KYC"}
        </Button>
      )}

      {kycSubmission?.status === "pending" && (
        <Button
          size="sm"
          variant="destructive"
          disabled={loading === "reject"}
          onClick={() => handleAction("reject")}
        >
          {loading === "reject" ? "Rejecting..." : "Reject KYC"}
        </Button>
      )}

      {isAgent && !isAgentActivated && (
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading === "activate"}
          onClick={() => handleAction("activate")}
        >
          {loading === "activate" ? "Activating..." : "Activate Agent"}
        </Button>
      )}

      {isAgent && isAgentActivated && (
        <Button
          size="sm"
          variant="destructive"
          disabled={loading === "deactivate"}
          onClick={() => handleAction("deactivate")}
        >
          {loading === "deactivate" ? "Deactivating..." : "Deactivate Agent"}
        </Button>
      )}

      {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
      {success && (
        <span className="text-green-600 text-xs ml-2">{success}</span>
      )}
    </div>
  );
}
