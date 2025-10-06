import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentManagement } from "@/components/agent-management";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";

// Cache for 3 minutes
export const revalidate = 180;

export default async function AdminAgentsPage() {
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

  // Get all agents with their statistics
  const { data: agents, error: agentsError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (agentsError) {
    console.error("Error fetching agents:", agentsError);
  }

  // If we have agents, try to get their stats, otherwise use empty stats
  let agentsWithStats = agents || [];

  if (agents && agents.length > 0) {
    try {
      agentsWithStats = await Promise.all(
        agents.map(async (agent) => {
          try {
            const [
              { count: downlineCount },
              { data: commissions },
              { count: submissionCount },
            ] = await Promise.all([
              supabase
                .from("agent_hierarchy")
                .select("*", { count: "exact", head: true })
                .eq("upline_id", agent.id),
              supabase
                .from("commissions")
                .select("amount")
                .eq("agent_id", agent.id),
              supabase
                .from("payment_submissions")
                .select("*", { count: "exact", head: true })
                .eq("submitter_id", agent.id),
            ]);

            return {
              ...agent,
              downlines: [{ count: downlineCount || 0 }],
              commissions: commissions || [],
              submissions: [{ count: submissionCount || 0 }],
            };
          } catch (error) {
            console.error(`Error fetching stats for agent ${agent.id}:`, error);
            // Return agent with empty stats if individual queries fail
            return {
              ...agent,
              downlines: [{ count: 0 }],
              commissions: [],
              submissions: [{ count: 0 }],
            };
          }
        })
      );
    } catch (error) {
      console.error("Error fetching agent stats:", error);
      // Use basic agent data without stats if stats queries fail
      agentsWithStats = agents.map((agent) => ({
        ...agent,
        downlines: [{ count: 0 }],
        commissions: [],
        submissions: [{ count: 0 }],
      }));
    }
  }

  // Get system statistics
  const [
    { count: totalAgents },
    { count: activeAgents },
    { count: totalSubmissions },
    { count: pendingSubmissions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("payment_submissions")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("payment_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent Management</h1>
        <p className="text-muted-foreground">
          Manage all agents and monitor system performance
        </p>
      </div>

      {/* System Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Management Component */}
      <AgentManagement agents={agentsWithStats || []} />
    </div>
  );
}
