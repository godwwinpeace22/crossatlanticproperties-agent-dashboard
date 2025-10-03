import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  FileText,
  Users,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Heart,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import Link from "next/link";

export default async function AdminDashboardPage() {
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

  // Get admin dashboard data
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
  ]);

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
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
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
            <Link href="/dashboard/admin/property-interests" className="block">
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
                      {payment.property_interest?.property?.name} • Installment
                      #{payment.installment_number} • Due:{" "}
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
    </div>
  );
}
