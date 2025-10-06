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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  DollarSign,
  Heart,
  Building2,
  Calendar,
  Mail,
  Phone,
  TrendingUp,
  Network,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import Link from "next/link";

// Cache this page for 5 minutes (300 seconds)
export const revalidate = 300;

export default async function AgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  // Get agent details
  const { data: agent } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!agent) {
    redirect("/dashboard/admin/agents");
  }

  // Get agent statistics
  const [
    { count: downlineCount },
    { data: commissions },
    { data: propertyInterests },
    { data: agentOwnInterests },
    { data: downlines },
    { data: upline },
    { count: totalReferrals },
  ] = await Promise.all([
    // Count downlines
    supabase
      .from("agent_hierarchy")
      .select("*", { count: "exact", head: true })
      .eq("upline_id", params.id)
      .eq("approved", true),
    // Get commissions
    supabase
      .from("commissions")
      .select("*")
      .eq("agent_id", params.id)
      .order("created_at", { ascending: false }),
    // Get property interests where this agent is the referring agent
    supabase
      .from("property_interests")
      .select(
        `
        *,
        profiles!property_interests_user_id_fkey(full_name, email),
        property:properties(name, price, city, category)
      `
      )
      .eq("referring_agent_id", params.id)
      .order("created_at", { ascending: false }),
    // Get property interests where this agent is the user/investor
    supabase
      .from("property_interests")
      .select(
        `
        *,
        property:properties(name, price, city, category),
        referring_agent:profiles!property_interests_referring_agent_id_fkey(full_name, email)
      `
      )
      .eq("user_id", params.id)
      .order("created_at", { ascending: false }),
    // Get direct downlines with details
    supabase
      .from("agent_hierarchy")
      .select(
        `
        *,
        agent:profiles!agent_hierarchy_agent_id_fkey(id, full_name, email, created_at)
      `
      )
      .eq("upline_id", params.id)
      .eq("approved", true)
      .order("created_at", { ascending: false }),
    // Get upline
    supabase
      .from("agent_hierarchy")
      .select(
        `
        *,
        upline:profiles!agent_hierarchy_upline_id_fkey(id, full_name, email)
      `
      )
      .eq("agent_id", params.id)
      .eq("approved", true)
      .single(),
    // Count total referrals
    supabase
      .from("property_interests")
      .select("*", { count: "exact", head: true })
      .eq("referring_agent_id", params.id),
  ]);

  const totalEarnings =
    commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const pendingInterests =
    propertyInterests?.filter((i: any) => i.status === "pending").length || 0;
  const approvedInterests =
    propertyInterests?.filter((i: any) => i.status === "approved").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {agent.full_name || "Unnamed Agent"}
            </h1>
            <p className="text-muted-foreground">Agent Details & Performance</p>
          </div>
        </div>
        <Badge
          variant={agent.status === "active" ? "default" : "secondary"}
          className="capitalize"
        >
          {agent.status}
        </Badge>
      </div>

      {/* Agent Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{agent.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{agent.phone || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(agent.created_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">
                {agent.role === "admin" ? "Admin" : "Agent"}
              </Badge>
              {agent.referral_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Referral Code</p>
                  <p className="font-mono font-medium">{agent.referral_id}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {commissions?.length || 0} commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downlines</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downlineCount || 0}</div>
            <p className="text-xs text-muted-foreground">Direct referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <Heart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInterests} pending, {approvedInterests} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upline</CardTitle>
            <Network className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {upline ? (
              <>
                <div className="text-sm font-bold truncate">
                  {upline.upline?.full_name || "Unknown"}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {upline.upline?.email}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No upline</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Network - Downlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Direct Downlines ({downlines?.length || 0})
          </CardTitle>
          <CardDescription>
            Agents directly referred by this agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {downlines && downlines.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downlines.map((hierarchy: any) => (
                    <TableRow key={hierarchy.id}>
                      <TableCell className="font-medium">
                        {hierarchy.agent?.full_name || "Unnamed Agent"}
                      </TableCell>
                      <TableCell>{hierarchy.agent?.email}</TableCell>
                      <TableCell>
                        {formatDate(hierarchy.agent?.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/admin/agents/${hierarchy.agent?.id}`}
                          >
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No direct downlines yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Referrals ({propertyInterests?.length || 0})
          </CardTitle>
          <CardDescription>
            Customers referred by this agent to properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {propertyInterests && propertyInterests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Payment Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyInterests.map((interest: any) => (
                    <TableRow key={interest.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {interest.profiles?.full_name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {interest.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {interest.property?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {interest.property?.city}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {interest.selected_payment_plan?.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            interest.status === "approved"
                              ? "default"
                              : interest.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="capitalize"
                        >
                          {interest.status === "payment_pending"
                            ? "Payment Pending"
                            : interest.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(interest.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/admin/property-interests/${interest.id}`}
                          >
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent's Own Property Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Personal Interests ({agentOwnInterests?.length || 0})
          </CardTitle>
          <CardDescription>
            Properties this agent is personally interested in purchasing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentOwnInterests && agentOwnInterests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Payment Plan</TableHead>
                    <TableHead>Referred By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentOwnInterests.map((interest: any) => (
                    <TableRow key={interest.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {interest.property?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {interest.property?.city} •{" "}
                            {interest.property?.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {interest.selected_payment_plan?.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        {interest.referring_agent?.full_name || "Direct"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            interest.status === "approved"
                              ? "default"
                              : interest.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="capitalize"
                        >
                          {interest.status === "payment_pending"
                            ? "Payment Pending"
                            : interest.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(interest.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/admin/property-interests/${interest.id}`}
                          >
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No personal property interests yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Commission History ({commissions?.length || 0})
          </CardTitle>
          <CardDescription>
            All commissions earned by this agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission: any) => (
                    <TableRow key={commission.id}>
                      <TableCell>{formatDate(commission.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Level {commission.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {commission.commission_type}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(Number(commission.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No commission history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
