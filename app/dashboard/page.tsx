import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  Heart,
  FileText,
  Clock,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { KYCStatusCard } from "@/components/kyc-status-card";
import { MyReferralsCard } from "@/components/my-referrals-card";
import { FeaturedReferralCard } from "@/components/featured-referral-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user profile with referral_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, referral_id")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Get dashboard stats based on role
  if (isAdmin) {
    // Admin stats
    const [
      { count: totalProperties },
      { count: totalAgents },
      { count: pendingApprovals },
      { data: totalCommissionsData },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .neq("role", "admin"),
      supabase
        .from("payment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("commissions").select("amount"),
      supabase
        .from("payment_submissions")
        .select(
          `
          amount, 
          created_at, 
          profiles!inner(full_name, email)
        `
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const totalCommissionsPaid =
      totalCommissionsData?.reduce(
        (sum, commission) => sum + Number(commission.amount),
        0
      ) || 0;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Admin Dashboard - {profile?.full_name || profile?.email}
          </h1>
          <p className="text-muted-foreground">Overview</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Properties
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totalProperties || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Properties in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commissions Paid
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCommissionsPaid)}
              </div>
              <p className="text-xs text-muted-foreground">All time payouts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Agents
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totalAgents || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Registered agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approvals
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(pendingApprovals || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {recentActivity && recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest payment submissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {(activity as any).profiles?.full_name ||
                          (activity as any).profiles?.email ||
                          "Unknown User"}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(Number(activity.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Agent stats (existing logic + property interests)
  const [
    { count: totalProperties },
    { count: totalCommissions },
    { count: networkSize },
    { data: recentCommissions },
    { data: propertyInterests },
    { data: kycSubmission },
    { data: pendingPayments },
    { data: unreadNotifications },
    { data: myReferrals },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase
      .from("commissions")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", user.id),
    supabase
      .from("agent_hierarchy")
      .select("*", { count: "exact", head: true })
      .eq("upline_id", user.id),
    supabase
      .from("commissions")
      .select("amount, created_at")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    // Property interests for this agent/customer
    supabase
      .from("property_interests")
      .select(
        `
        *,
        property:properties(name, price)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    // KYC submission
    supabase
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    // Pending payments
    supabase
      .from("installment_payments")
      .select("*", { count: "exact", head: true })
      .eq("property_interest.user_id", user.id)
      .eq("status", "pending"),
    // Unread notifications
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
    // Property interests that used this agent's referral
    supabase
      .from("property_interests")
      .select(
        `
        *,
        profiles:profiles!property_interests_user_id_fkey(full_name, email),
        property:properties(name, price, city)
      `
      )
      .eq("referring_agent_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const totalEarnings =
    recentCommissions?.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0
    ) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {profile?.full_name || profile?.email}
        </h1>
        <p className="text-muted-foreground">
          Your dashboard and property investment overview
        </p>
      </div>

      {/* Featured Referral Code Card - Prominently displayed */}
      <FeaturedReferralCard referralCode={profile?.referral_id || ""} />

      {/* MLM Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalProperties || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Properties to market
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">Commission earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(networkSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Direct downlines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Property Investments
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertyInterests?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Properties invested in
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Property Investment Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* KYC Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KYC Status
          </h2>
          <KYCStatusCard kycSubmission={kycSubmission} />
          {!kycSubmission && (
            <Button asChild className="w-full">
              <Link href="/dashboard/my-interests">
                Complete KYC to Start Investing
              </Link>
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Investment Summary</h2>
          <div className="grid gap-3">
            <Card className="py-5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">
                      Pending Payments
                    </span>
                  </div>
                  <Badge variant="secondary">{pendingPayments || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* My Referrals Section */}
      <MyReferralsCard
        referrals={myReferrals || []}
        referralCode={profile?.referral_id || ""}
      />

      {/* Property Interests Summary */}
      {propertyInterests && propertyInterests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Recent Properties</span>

              <Link
                href="/dashboard/my-interests"
                className="text-blue-500 text-sm"
              >
                View All
              </Link>
            </CardTitle>
            <CardDescription>
              Your latest property investments and interests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {propertyInterests.slice(0, 3).map((interest: any) => (
                <div
                  key={interest.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p className="font-medium">
                      {interest.property?.name ||
                        `Property #${interest.property_id.slice(-8)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {interest.selected_payment_plan} plan • Status:{" "}
                      {interest.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        interest.status === "pending"
                          ? "secondary"
                          : interest.status === "approved"
                          ? "default"
                          : interest.status === "completed"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {interest.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
              {propertyInterests.length > 3 && (
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/dashboard/my-interests">
                    View All {propertyInterests.length} Interests
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Start Your Property Investment Journey
            </CardTitle>
            <CardDescription>
              Browse available properties and express your interest to start
              investing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              As an agent, you can also invest in properties. Complete your KYC
              verification and express interest in properties to get started
              with your investment portfolio.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/(main)/properties">Browse Properties</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/kyc">Complete KYC</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MLM Commission History */}
      {recentCommissions && recentCommissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Commissions</CardTitle>
            <CardDescription>Your latest commission earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCommissions.map((commission, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {new Date(commission.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(commission.amount))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
