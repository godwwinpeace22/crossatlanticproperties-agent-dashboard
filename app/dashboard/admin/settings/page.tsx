import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommissionSettings } from "@/components/commission-settings";
import { PropertyTypesManager } from "@/components/property-types-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminSettingsPage() {
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

  // Get commission settings
  const { data: commissionSettings } = await supabase
    .from("commission_settings")
    .select("*")
    .order("level");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure MLM system parameters and commission rates
        </p>
      </div>

      <CommissionSettings settings={commissionSettings || []} />

      <PropertyTypesManager />

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current system configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Commission Structure</h4>
              <p className="text-sm text-muted-foreground">
                Multi-level commission system with{" "}
                {commissionSettings?.length || 0} levels configured. Commissions
                are calculated automatically when payments are approved.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Approval Process</h4>
              <p className="text-sm text-muted-foreground">
                All payment submissions require admin approval before creating
                hierarchy relationships and calculating commissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
