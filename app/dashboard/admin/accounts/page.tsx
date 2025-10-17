import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminAccountCreation } from "@/components/admin-account-creation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Shield, Briefcase, UserPlus } from "lucide-react";

export default async function AdminAccountsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get account statistics
  const { data: accountStats } = await supabase
    .from("profiles")
    .select("role")
    .neq("role", "admin");

  const stats =
    accountStats?.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  const roleIcons = {
    agent: Users,
    buyer: Briefcase,
    staff: UserPlus,
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-muted-foreground">
            Create and manage user accounts
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Account Overview
            </CardTitle>
            <CardDescription>
              Current user distribution across roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(roleIcons).map(([role, Icon]) => (
                <div
                  key={role}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium capitalize">{role}s</span>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {stats[role] || 0}
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between font-medium">
                  <span>Total Users</span>
                  <span className="text-lg">
                    {Object.values(stats).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Creation */}
        <AdminAccountCreation />
      </div>

      {/* Additional Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Types & Permissions</CardTitle>
          <CardDescription>
            Understanding the different roles and their capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">Agents</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Manage referrals and commissions</li>
                <li>• Track network performance</li>
                <li>• Access agent dashboard</li>
                <li>• Submit property interests</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold">Buyers</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Browse property listings</li>
                <li>• Submit interests and payments</li>
                <li>• Complete KYC verification</li>
                <li>• Track payment status</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold">Staff</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Limited administrative access</li>
                <li>• Support customer queries</li>
                <li>• Process certain approvals</li>
                <li>• View reports and analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
