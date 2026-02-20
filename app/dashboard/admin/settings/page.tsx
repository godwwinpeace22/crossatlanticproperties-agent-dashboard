import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/roles";
import { CommissionSettings } from "@/components/commission-settings";
import { PropertyTypesManager } from "@/components/property-types-manager";
import { LocationsManager } from "@/components/locations-manager";
import { ApplicationFeeSettings } from "@/components/system-settings-manager";
import { HeroSettingsManager } from "@/components/hero-settings-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  if (!isAdminRole(profile?.role)) {
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
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure system parameters, commissions, properties, and locations
        </p>
      </div>

      <Tabs defaultValue="system-settings" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="system-settings">Application Fee</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="properties">Property Types</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="hero">Homepage Hero</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="system-settings" className="space-y-4">
          <ApplicationFeeSettings />
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <CommissionSettings settings={commissionSettings || []} />
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <PropertyTypesManager />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <LocationsManager />
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <HeroSettingsManager />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
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
                    {commissionSettings?.length || 0} levels configured.
                    Commissions are calculated automatically when payments are
                    approved.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Approval Process</h4>
                  <p className="text-sm text-muted-foreground">
                    All payment submissions require admin approval before
                    creating hierarchy relationships and calculating
                    commissions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
