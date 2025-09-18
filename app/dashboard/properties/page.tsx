import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, MapPin, DollarSign } from "lucide-react";
import { Building2 } from "lucide-react"; // Declared the Building2 variable

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

  // Get all properties
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  const isAdmin = profile?.role === "admin";

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

      {!properties || properties.length === 0 ? (
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <Badge
                    variant={
                      property.status === "available" ? "default" : "secondary"
                    }
                  >
                    {property.status}
                  </Badge>
                </div>
                {property.location && (
                  <CardDescription className="flex items-center">
                    <MapPin className="mr-1 h-3 w-3" />
                    {property.location}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {property.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="mr-1 h-4 w-4 text-green-600" />
                      <span className="text-lg font-semibold">
                        ${Number(property.price).toLocaleString()}
                      </span>
                    </div>
                    {property.category && (
                      <Badge variant="outline">{property.category}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      asChild
                    >
                      <Link href={`/dashboard/properties/${property.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/dashboard/properties/${property.id}/edit`}
                        >
                          Edit
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
