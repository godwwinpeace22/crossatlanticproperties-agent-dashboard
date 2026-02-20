import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  ArrowLeft,
  Shield,
  Briefcase,
  Users as UsersIcon,
  DollarSign,
  Network,
  Heart,
  Building2,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { UserDocuments } from "@/components/user-documents";
import { AdminUserKycActions } from "@/components/admin-user-kyc-actions";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { isAdminRole } from "@/lib/roles";

interface PageProps {
  params: {
    userId: string;
  };
}

export default async function UserDetailPage({ params }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !currentUser) {
    redirect("/login");
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (profileError || !isAdminRole(currentProfile?.role)) {
    redirect("/dashboard");
  }

  // Get the user being viewed
  const { data: targetUser, error: userError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.userId)
    .single();

  if (userError || !targetUser) {
    notFound();
  }

  const handleActivateAgent = async () => {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ agent_activated: true })
        .eq("id", currentProfile?.id);
    } catch (e) {
    } finally {
    }
  };

  // Get comprehensive user data
  const [
    { count: downlineCount },
    { data: commissions },
    { data: propertyInterests },
    { data: userOwnInterests },
    { data: downlines },
    { data: upline },
    { count: totalReferrals },
    { data: kycSubmission },
    { data: installmentPayments },
    { data: interestPayments },
  ] = await Promise.all([
    // Count downlines (if user is an agent)
    supabase
      .from("agent_hierarchy")
      .select("*", { count: "exact", head: true })
      .eq("upline_id", params.userId)
      .eq("approved", true),
    // Get commissions earned by this user
    supabase
      .from("commissions")
      .select("*")
      .eq("agent_id", params.userId)
      .order("created_at", { ascending: false }),
    // Get property interests where this user is the referring agent
    supabase
      .from("property_interests")
      .select(
        `
        *,
        profiles!property_interests_user_id_fkey(full_name, email),
        property:properties(name, price, city, category)
      `,
      )
      .eq("referring_agent_id", params.userId)
      .order("created_at", { ascending: false }),
    // Get property interests where this user is the investor
    supabase
      .from("property_interests")
      .select(
        `
        *,
        property:properties(name, price, city, category),
        referring_agent:profiles!property_interests_referring_agent_id_fkey(full_name, email)
      `,
      )
      .eq("user_id", params.userId)
      .order("created_at", { ascending: false }),
    // Get direct downlines with details
    supabase
      .from("agent_hierarchy")
      .select(
        `
        *,
        agent:profiles!agent_hierarchy_agent_id_fkey(id, full_name, email, created_at)
      `,
      )
      .eq("upline_id", params.userId)
      .eq("approved", true)
      .order("created_at", { ascending: false }),
    // Get upline
    supabase
      .from("agent_hierarchy")
      .select(
        `
        *,
        upline:profiles!agent_hierarchy_upline_id_fkey(id, full_name, email)
      `,
      )
      .eq("agent_id", params.userId)
      .eq("approved", true)
      .single(),
    // Count total referrals (property interests generated)
    supabase
      .from("property_interests")
      .select("*", { count: "exact", head: true })
      .eq("referring_agent_id", params.userId),
    // Get KYC submission
    supabase
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", params.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    // Get installment payments
    supabase
      .from("installment_payments")
      .select(
        `
        *,
        property_interest:property_interests(
          *,
          property:properties(name)
        )
      `,
      )
      .eq("property_interest.user_id", params.userId)
      .order("due_date", { ascending: false }),
    // Get interest payments (application fees)
    supabase
      .from("interest_payments")
      .select(
        `
        *,
        property_interest:property_interests(
          *,
          property:properties(name, price)
        )
      `,
      )
      .eq("user_id", params.userId)
      .order("created_at", { ascending: false }),
  ]);

  // Calculate statistics
  const totalCommissions =
    commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const totalInvestments = userOwnInterests?.length || 0;
  const totalPaidPayments =
    installmentPayments?.filter((p) => p.status === "paid").length || 0;
  const totalPendingPayments =
    installmentPayments?.filter((p) => p.status === "pending").length || 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-200 text-purple-900 border-purple-300";
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "manager":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "agent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "buyer":
        return "bg-green-100 text-green-800 border-green-200";
      case "staff":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return Shield;
      case "admin":
        return Shield;
      case "manager":
        return Shield;
      case "agent":
        return UsersIcon;
      case "buyer":
        return Briefcase;
      case "staff":
        return User;
      default:
        return User;
    }
  };

  const getInterestStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return CheckCircle;
      case "pending":
        return Clock;
      case "rejected":
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const RoleIcon = getRoleIcon(targetUser.role);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">
              {targetUser.full_name || "Unnamed User"}
            </h1>
            <p className="text-muted-foreground">User Management</p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="font-medium">{targetUser.email}</p>
              <p className="font-medium">{targetUser.phone}</p>
            </div>

            {/* <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                Phone Number
              </div>
              <p className="font-medium">
                {targetUser.phone || (
                  <span className="text-muted-foreground">Not provided</span>
                )}
              </p>
            </div> */}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RoleIcon className="h-4 w-4" />
                Role & Status
              </div>
              <div className="flex gap-2">
                <Badge className={getRoleColor(targetUser.role)}>
                  {targetUser.role}
                </Badge>
                <Badge className={getStatusColor(targetUser.status)}>
                  {targetUser.agent_activated ? "Activated" : "Not Activated"}
                </Badge>
              </div>

              {/* Admin Controls */}
              <div className="pt-2 flex gap-2">
                {/* <form
                  action={`/api/admin/users/${targetUser.id}/toggle-status`}
                  method="POST"
                >
                  <Button
                    type="submit"
                    size="sm"
                    variant={
                      targetUser.status === "active" ? "destructive" : "default"
                    }
                  >
                    {targetUser.status === "active" ? "Deactivate" : "Activate"}{" "}
                    User
                  </Button>
                </form> */}

                {/* KYC Actions (Approve/Reject) */}

                <AdminUserKycActions
                  kycId={kycSubmission?.id}
                  userId={targetUser?.id}
                  isAgent={targetUser?.role === "agent"}
                  agentActivated={!!targetUser?.agent_activated}
                  user={targetUser}
                  kycSubmission={kycSubmission}
                  //   onActivateAgent={handleActivateAgent}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined
              </div>
              <p className="font-medium">{formatDate(targetUser.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {targetUser?.role !== "staff" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Commissions
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalCommissions)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Network className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Network Size
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(downlineCount || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Property Interests
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(totalInvestments)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Referrals
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(totalReferrals || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different sections */}
      {targetUser?.role !== "staff" && (
        <Tabs defaultValue="investments" className="w-full">
          <TabsList>
            <TabsTrigger
              value="investments"
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              Investments
            </TabsTrigger>
            <TabsTrigger
              value="commissions"
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger
              value="interest-payments"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Interest Payments
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="investments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Investments</CardTitle>
                <CardDescription>
                  Properties this user has invested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userOwnInterests && userOwnInterests.length > 0 ? (
                  <div className="space-y-4">
                    {userOwnInterests.map((interest) => (
                      <div key={interest.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {interest.property?.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {interest.property?.city} •{" "}
                              {interest.property?.category}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {formatDate(interest.created_at)}
                            </p>
                            {interest.referring_agent && (
                              <p className="text-sm text-muted-foreground">
                                Referred by:{" "}
                                {interest.referring_agent.full_name ||
                                  interest.referring_agent.email}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-center gap-2">
                            {/* <Badge
                            className={
                              interest.status === "approved"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : interest.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {interest.status}
                          </Badge> */}
                            {/* <p className="text-sm font-medium">
                            {formatCurrency(interest.property?.price)}
                          </p> */}
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/dashboard/admin/property-interests/${interest.id}`}
                              >
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No property investments yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission History</CardTitle>
                <CardDescription>
                  Commissions earned from referrals and network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commissions && commissions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            {formatDate(commission.created_at)}
                          </TableCell>
                          <TableCell>Level {commission.level}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(commission.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Paid
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No commissions earned yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="mt-6">
            <div className="grid gap-6">
              {/* Upline */}
              {upline && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Upline Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {upline.upline?.full_name || upline.upline?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {upline.upline?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Connected since {formatDate(upline.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Downlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Direct Downlines ({downlineCount || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {downlines && downlines.length > 0 ? (
                    <div className="space-y-3">
                      {downlines.map((downline) => (
                        <div
                          key={downline.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {downline.agent?.full_name ||
                                  downline.agent?.email}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {downline.agent?.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            Joined {formatDate(downline.agent?.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No direct downlines yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referral Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Referral Activity</CardTitle>
                  <CardDescription>
                    Property interests generated through referrals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {propertyInterests && propertyInterests.length > 0 ? (
                    <div className="space-y-4">
                      {propertyInterests.map((interest) => (
                        <div
                          key={interest.id}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">
                                {interest.property?.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Buyer:{" "}
                                {interest.profiles?.full_name ||
                                  interest.profiles?.email}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(interest.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                className={
                                  interest.status === "approved"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : interest.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                }
                              >
                                {interest.status}
                              </Badge>
                              <p className="text-sm font-medium mt-1">
                                {formatCurrency(interest.property?.price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No referral activity yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="interest-payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Interest Fee Payments</CardTitle>
                <CardDescription>
                  Application fees paid for property interests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {interestPayments && interestPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interestPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {formatDate(payment.created_at)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {payment.property_interest?.property?.name ||
                                  "Unknown Property"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Total Price:{" "}
                                {formatCurrency(
                                  payment.property_interest?.property?.price ||
                                    0,
                                )}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                payment.status === "successful"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {payment.paystack_reference || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {payment.property_interest_id && (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/dashboard/admin/property-interests/${payment.property_interest_id}`}
                                >
                                  View Interest
                                </Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No interest fee payments yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <UserDocuments
              targetUserId={targetUser.id}
              isAdminView={true}
              userName={targetUser.full_name || targetUser.email}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
