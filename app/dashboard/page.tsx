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

  // Get dashboard stats
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
