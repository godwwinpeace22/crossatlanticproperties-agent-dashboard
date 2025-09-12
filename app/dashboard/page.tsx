import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, DollarSign, Users, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
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

  // Agent stats (existing logic)
  const [
    { count: totalProperties },
    { count: totalCommissions },
    { count: networkSize },
    { data: recentCommissions },
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
          Here's an overview of your MLM dashboard
        </p>
      </div>

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
              Commission Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10%</div>
            <p className="text-xs text-muted-foreground">Level 1 commission</p>
          </CardContent>
        </Card>
      </div>

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
