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
  AlertTriangle,
  CheckCircle,
  PenTool,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { KYCStatusCard } from "@/components/kyc-status-card";
import { MyReferralsCard } from "@/components/my-referrals-card";
import { FeaturedReferralCard } from "@/components/featured-referral-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Cache dashboard for 2 minutes
export const revalidate = 120;

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
    // Admin stats - comprehensive dashboard
    const [
      { count: totalAgents },
      { count: totalProperties },
      { count: pendingKYC },
      { count: pendingInterests },
      { count: overduePayments },
      { count: totalPaymentSubmissions },
      { data: recentKYCSubmissions },
      { data: recentPropertyInterests },
      { data: overduePaymentsList },
      { data: recentAgents },
      { data: topAgents },
      { count: totalCommissionsPaid },
      { data: recentProperties },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "agent"),
      supabase.from("properties").select("*", { count: "exact", head: true }),
      supabase
        .from("kyc_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("property_interests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("installment_payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .lt("due_date", new Date().toISOString()),
      supabase
        .from("payment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      // Recent KYC submissions
      supabase
        .from("kyc_submissions")
        .select(
          `
          *,
          profiles!inner(full_name, email)
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
      // Recent property interests
      supabase
        .from("property_interests")
        .select(
          `
          *,
          profiles!inner(full_name, email),
          property:properties!inner(name, price)
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
      // Overdue payments details
      supabase
        .from("installment_payments")
        .select(
          `
          *,
          property_interest:property_interests!inner(
            *,
            profiles!inner(full_name, email),
            property:properties!inner(name)
          )
        `
        )
        .eq("status", "pending")
        .lt("due_date", new Date().toISOString())
        .order("due_date", { ascending: true })
        .limit(5),
      // Recent agents
      supabase
        .from("profiles")
        .select("id, full_name, email, created_at, status")
        .eq("role", "agent")
        .order("created_at", { ascending: false })
        .limit(5),
      // Top agents by commission
      supabase
        .from("commissions")
        .select(
          `
          agent_id,
          amount,
          profiles!inner(id, full_name, email)
        `
        )
        .order("amount", { ascending: false })
        .limit(100),
      // Total commissions paid
      supabase.from("commissions").select("*", { count: "exact", head: true }),
      // Recent properties
      supabase
        .from("properties")
        .select("id, name, price, city, category, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Calculate top agents by total commissions
    const agentCommissions = new Map<
      string,
      { id: string; name: string; email: string; total: number }
    >();
    topAgents?.forEach((commission: any) => {
      const agentId = commission.profiles.id;
      const existing = agentCommissions.get(agentId);
      if (existing) {
        existing.total += Number(commission.amount || 0);
      } else {
        agentCommissions.set(agentId, {
          id: commission.profiles.id,
          name: commission.profiles.full_name || "Unknown",
          email: commission.profiles.email,
          total: Number(commission.amount || 0),
        });
      }
    });
    const topPerformers = Array.from(agentCommissions.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage KYC approvals, property interests, and payment tracking
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Agents
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totalAgents || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Active agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totalProperties || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available properties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(pendingKYC || 0) +
                  (pendingInterests || 0) +
                  (totalPaymentSubmissions || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                KYC, interests & payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue Payments
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overduePayments || 0}
              </div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link href="/dashboard/admin/kyc-approvals" className="block">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">KYC Approvals</h3>
                    <p className="text-sm text-muted-foreground">
                      {pendingKYC || 0} pending
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link
                href="/dashboard/admin/property-interests"
                className="block"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Property Interests</h3>
                    <p className="text-sm text-muted-foreground">
                      {pendingInterests || 0} pending
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link href="/dashboard/admin/payment-tracking" className="block">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Payment Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      {overduePayments || 0} overdue
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link href="/dashboard/admin/approvals" className="block">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Payment Approvals</h3>
                    <p className="text-sm text-muted-foreground">
                      {totalPaymentSubmissions || 0} pending
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {overduePaymentsList && overduePaymentsList.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Overdue Payments Alert
              </CardTitle>
              <CardDescription className="text-red-700">
                These payments are past due and need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overduePaymentsList.slice(0, 3).map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-white rounded border"
                  >
                    <div>
                      <p className="font-medium">
                        {payment.property_interest?.profiles?.full_name ||
                          "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.property_interest?.property?.name} •
                        Installment #{payment.installment_number} • Due:{" "}
                        {formatDate(payment.due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatCurrency(Number(payment.amount))}
                      </p>
                      <Badge variant="destructive">
                        {Math.floor(
                          (new Date().getTime() -
                            new Date(payment.due_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days overdue
                      </Badge>
                    </div>
                  </div>
                ))}
                {overduePaymentsList.length > 3 && (
                  <div className="text-center">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/admin/payment-tracking">
                        View All {overduePaymentsList.length} Overdue Payments
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent KYC Submissions */}
          {recentKYCSubmissions && recentKYCSubmissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent KYC Submissions
                </CardTitle>
                <CardDescription>
                  Latest KYC applications awaiting review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentKYCSubmissions.map((submission: any) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {submission.profiles?.full_name ||
                            submission.profiles?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {submission.buyer_type} •{" "}
                          {formatDate(submission.created_at)}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/dashboard/admin/kyc-approvals">
                      View All KYC Submissions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Property Interests */}
          {recentPropertyInterests && recentPropertyInterests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Recent Property Interests
                </CardTitle>
                <CardDescription>
                  Latest property interest submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPropertyInterests.map((interest: any) => (
                    <div
                      key={interest.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {interest.profiles?.full_name ||
                            interest.profiles?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {interest.property?.name} •{" "}
                          {interest.selected_payment_plan}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/dashboard/admin/property-interests">
                      View All Property Interests
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* More Activity - Recent Agents and Top Performers */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Agents */}
          {recentAgents && recentAgents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Agents
                </CardTitle>
                <CardDescription>
                  Newly registered agents in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAgents.map((agent: any) => (
                    <Link
                      key={agent.id}
                      href={`/dashboard/admin/agents/${agent.id}`}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {agent.full_name || "Unnamed Agent"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {agent.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(agent.created_at)}
                        </p>
                        <Badge
                          variant={
                            agent.status === "active" ? "default" : "secondary"
                          }
                          className="mt-1"
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/dashboard/admin/agents">View All Agents</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Agents */}
          {topPerformers && topPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Agents with highest commission earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((agent: any, index: number) => (
                    <Link
                      key={agent.id}
                      href={`/dashboard/admin/agents/${agent.id}`}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(agent.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Earned
                        </p>
                      </div>
                    </Link>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/dashboard/admin/agents">
                      View All Agents Performance
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Properties */}
        {recentProperties && recentProperties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Recent Properties
              </CardTitle>
              <CardDescription>
                Latest properties added to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recentProperties.map((property: any) => (
                  <Link
                    key={property.id}
                    href={`/dashboard/admin/listings/${property.id}`}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="capitalize">{property.category}</Badge>
                      <Badge
                        variant={
                          property.status === "available"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {property.status}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-1 line-clamp-1">
                      {property.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {property.city}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-green-600">
                        {formatCurrency(Number(property.price))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(property.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <Button asChild variant="ghost" className="w-full mt-4">
                <Link href="/dashboard/admin/listings">
                  View All Properties
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* System Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Platform Overview
            </CardTitle>
            <CardDescription>
              Overall system health and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total Agents</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(totalAgents || 0)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">Total Properties</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(totalProperties || 0)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Total Commissions</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(totalCommissionsPaid || 0)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">Property Interests</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(pendingInterests || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
    // Pending payments - need to join property_interests to filter by user
    supabase
      .from("installment_payments")
      .select(
        `
        *,
        property_interest:property_interests!inner(user_id)
      `,
        { count: "exact" }
      )
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
