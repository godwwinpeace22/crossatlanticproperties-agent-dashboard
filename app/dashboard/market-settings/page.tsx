import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MarketSettingsManager } from "@/components/market-settings-manager";

export default async function MarketSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Market Analysis Settings</h1>
        <p className="text-muted-foreground">
          Configure base prices and growth rates for cities in the market
          analysis
        </p>
      </div>

      <MarketSettingsManager />
    </div>
  );
}
