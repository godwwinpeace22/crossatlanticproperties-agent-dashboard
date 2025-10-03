import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { PaymentApprovalList } from "@/components/payment-approval-list";

export default async function PropertyInterestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get property interest with all related data
  const { data: interest, error } = await supabase
    .from("property_interests")
    .select(
      `
      *,
      profiles:profiles!property_interests_user_id_fkey(
        full_name,
        email
      ),
      referring_agent:profiles!property_interests_referring_agent_id_fkey(
        full_name,
        email
      ),
      property:properties(*),
      interest_payment:interest_payments!property_interests_interest_payment_id_fkey(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching property interest:", error);
    notFound();
  }

  if (!interest) {
    console.error("No property interest found for id:", id);
    notFound();
  }

  // Get KYC submission for the user
  const { data: kycSubmission } = await supabase
    .from("kyc_submissions")
    .select("*")
    .eq("user_id", interest.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get installment payments for this interest
  const { data: installmentPayments } = await supabase
    .from("installment_payments")
    .select("*")
    .eq("property_interest_id", interest.id)
    .order("installment_number", { ascending: true });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string }> = {
      payment_pending: {
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30",
      },
      pending: {
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30",
      },
      approved: {
        className: "bg-green-100 text-green-800 dark:bg-green-900/30",
      },
      rejected: {
        className: "bg-red-100 text-red-800 dark:bg-red-900/30",
      },
      withdrawn: {
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30",
      },
      completed: {
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant="secondary" className={config.className}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-top gap-4">
        <Button variant="link" size="icon" asChild>
          <Link href="/dashboard/admin/property-interests">
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Property Interest Details</h1>
          <p className="text-muted-foreground">
            Review interest submission and manage payments
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {interest.profiles?.full_name || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{interest.profiles?.email || "N/A"}</span>
              </div>
            </div>

            {kycSubmission && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">KYC Status:</span>
                  <Badge
                    variant="secondary"
                    className={
                      kycSubmission.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : kycSubmission.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {kycSubmission.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Submitted:</span>
              <span className="text-sm font-medium">
                {formatDate(interest.created_at)}
              </span>
            </div>

            {interest.approved_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved:</span>
                <span className="text-sm font-medium">
                  {formatDate(interest.approved_at)}
                </span>
              </div>
            )}

            {interest.notes && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm text-muted-foreground mb-1">Notes:</div>
                <div className="text-sm">{interest.notes}</div>
              </div>
            )}

            {interest.referring_agent && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-medium mb-2">Referring Agent:</div>
                <div className="text-sm text-muted-foreground">
                  {interest.referring_agent.full_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {interest.referring_agent.email}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">
                {interest.property?.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{interest.property?.city}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="text-lg font-bold">
                  {formatCurrency(interest.property?.price || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <div className="text-lg font-semibold">
                  {interest.property?.category || "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Approval List */}
      {installmentPayments && installmentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Schedule & Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentApprovalList
              payments={installmentPayments}
              interestId={interest.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
