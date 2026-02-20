import { createClient } from "@/lib/supabase/server";
import { isAdminOrManager } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Building2 } from "lucide-react";
import { PropertiesGrid } from "@/components/properties-grid";
import { Card, CardContent } from "@/components/ui/card";

// Cache for 3 minutes
export const revalidate = 180;

export default async function PropertiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user profile to check if admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const pageSize = 12;

  // Get total count
  const { count: totalCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true });

  // Get initial properties
  const { data: initialProperties } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, pageSize - 1);

  const isAdmin = isAdminOrManager(profile?.role);
  const hasMore = (totalCount || 0) > pageSize;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage all properties in the system"
              : "Browse available properties to market"}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        )}
      </div>

      {!initialProperties || initialProperties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isAdmin
                ? "Get started by adding your first property to the system."
                : "No properties are currently available to market."}
            </p>
            {isAdmin && (
              <Button asChild>
                <Link href="/dashboard/properties/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <PropertiesGrid
          initialProperties={initialProperties}
          isAdmin={isAdmin}
          hasMore={hasMore}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}
