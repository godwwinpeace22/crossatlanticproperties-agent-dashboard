import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Share2,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";
import { PropertyPaymentCard } from "@/components/property-payment-card";
import { CopyReferralButton } from "@/components/copy-referral-button";

// Cache for 2 minutes
export const revalidate = 120;

export default async function MyReferralsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Get user profile with referral_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, referral_id")
    .eq("id", user.id)
    .single();

  // Get all property interests that used this agent's referral
  const { data: referrals } = await supabase
    .from("property_interests")
    .select(
      `
      *,
      profiles:profiles!property_interests_user_id_fkey(full_name, email),
      property:properties(name, price, city, category)
    `
    )
    .eq("referring_agent_id", user.id)
    .order("created_at", { ascending: false });

  // Get installment payments for all referrals
  const { data: allPayments } = await supabase
    .from("installment_payments")
    .select("*")
    .in("property_interest_id", referrals?.map((r) => r.id) || [])
    .order("due_date", { ascending: true });

  // Group payments by property interest
  const paymentsByReferral = (referrals || []).map((referral) => ({
    referral,
    payments:
      allPayments?.filter((p) => p.property_interest_id === referral.id) || [],
  }));

  // Calculate statistics
  const totalReferrals = referrals?.length || 0;
  const completedReferrals =
    referrals?.filter((r) => r.status === "completed").length || 0;
  const pendingReferrals =
    referrals?.filter((r) => r.status === "pending" || r.status === "approved")
      .length || 0;
  const totalValue =
    referrals?.reduce((sum, r) => sum + Number(r.property?.price || 0), 0) || 0;

  // Get commissions earned from referrals
  const { data: commissions } = await supabase
    .from("commissions")
    .select("amount")
    .eq("agent_id", user.id);

  const totalCommissions =
    commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  // Calculate payment statistics across all referrals
  const totalPaid =
    allPayments
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const overduePayments =
    allPayments?.filter(
      (p) => p.status === "pending" && new Date(p.due_date) < new Date()
    ).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Referrals</h1>
        <p className="text-muted-foreground">
          Track property interests that used your referral
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referrals
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Property interests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">Property value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overduePayments}
            </div>
            <p className="text-xs text-muted-foreground">Late payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Information
          </CardTitle>
          <CardDescription>
            Share this ID with potential buyers to earn commissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Your Referral Code
                </p>
                <p className="text-lg font-mono font-bold break-all">
                  {profile?.referral_id || "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Have buyers enter this code when expressing interest in a
                  property
                </p>
              </div>
              <CopyReferralButton
                referralCode={profile?.referral_id || ""}
                size="sm"
                variant="outline"
                className="shrink-0 ml-4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals with Payment Schedules */}
      {paymentsByReferral.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">
              Referrals & Payment Schedules ({totalReferrals})
            </h2>
            <p className="text-sm text-muted-foreground">
              Track payment progress for all referred property interests
            </p>
          </div>
          <div className="space-y-4">
            {paymentsByReferral.map(({ referral, payments }) => (
              <div key={referral.id} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    {referral.profiles?.full_name || referral.profiles?.email}
                  </span>
                  <span>•</span>
                  <span className="text-xs">
                    Submitted {formatDate(referral.created_at)}
                  </span>
                </div>
                <PropertyPaymentCard
                  property={referral.property}
                  payments={payments}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
            <p className="text-muted-foreground mb-4">
              Start sharing your referral ID to build your network and earn
              commissions
            </p>
            <Button asChild>
              <Link href="/(main)/properties">Browse Properties to Share</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
