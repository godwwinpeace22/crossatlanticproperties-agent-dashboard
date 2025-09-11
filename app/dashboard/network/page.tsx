import { createClient } from "@/lib/supabase/server";
import { NetworkVisualization } from "@/components/network-visualization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";

export default async function NetworkPage() {
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

  // Get network data - uplines and downlines
  const [uplineData, downlineData] = await Promise.all([
    // Get upline chain
    supabase.rpc("get_upline_chain", { agent_id: user.id }),
    // Get downline tree
    supabase.rpc("get_downline_tree", { agent_id: user.id }),
  ]);

  // Fallback to manual queries if RPC functions don't exist
  const networkData = [];

  // Get direct upline
  const { data: upline } = await supabase
    .from("agent_hierarchy")
    .select(
      `
      upline_id,
      level,
      upline:upline_id(id, full_name, email)
    `
    )
    .eq("agent_id", user.id)
    .eq("approved", true)
    .single();

  // Get direct downlines
  const { data: downlines } = await supabase
    .from("agent_hierarchy")
    .select(
      `
      agent_id,
      level,
      agent:agent_id(id, full_name, email)
    `
    )
    .eq("upline_id", user.id)
    .eq("approved", true);

  // Get network statistics
  const [{ count: totalDownlines }, { data: commissions }] = await Promise.all([
    supabase
      .from("agent_hierarchy")
      .select("*", { count: "exact", head: true })
      .eq("upline_id", user.id)
      .eq("approved", true),
    supabase
      .from("commissions")
      .select("amount, level")
      .eq("agent_id", user.id),
  ]);

  const totalEarnings =
    commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const networkLevels = Math.max(...(commissions?.map((c) => c.level) || [1]));

  // Transform the data to match expected interface (handle arrays from Supabase)
  const transformedUpline = upline
    ? {
        upline_id: upline.upline_id,
        upline: Array.isArray(upline.upline) ? upline.upline[0] : upline.upline,
      }
    : null;

  const transformedDownlines = (downlines || []).map((downline) => ({
    agent_id: downline.agent_id,
    agent: Array.isArray(downline.agent) ? downline.agent[0] : downline.agent,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Network</h1>
        <p className="text-muted-foreground">
          Visualize your position in the MLM hierarchy
        </p>
      </div>

      {/* Network Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Direct Downlines
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalDownlines || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Agents in your network
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Network Levels
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(networkLevels)}
            </div>
            <p className="text-xs text-muted-foreground">
              Deepest level reached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Network Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total commissions earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Network Hierarchy</CardTitle>
          <CardDescription>
            Interactive view of your uplines and downlines in the MLM structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NetworkVisualization
            currentUser={profile}
            upline={transformedUpline}
            downlines={transformedDownlines}
          />
        </CardContent>
      </Card>

      {/* Network Details */}
      {transformedUpline && (
        <Card>
          <CardHeader>
            <CardTitle>Your Upline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                {transformedUpline.upline?.full_name?.[0] ||
                  transformedUpline.upline?.email[0] ||
                  "U"}
              </div>
              <div>
                <p className="font-semibold">
                  {transformedUpline.upline?.full_name ||
                    transformedUpline.upline?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Level {upline?.level} above you
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {transformedDownlines && transformedDownlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Your Downlines ({formatNumber(transformedDownlines.length)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transformedDownlines.map((downline) => (
                <div
                  key={downline.agent_id}
                  className="flex items-center space-x-4"
                >
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-semibold text-sm">
                    {downline.agent?.full_name?.[0] ||
                      downline.agent?.email[0] ||
                      "A"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {downline.agent?.full_name || downline.agent?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Direct downline
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
