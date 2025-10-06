"use client";

import { useState } from "react";
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
import { MapPin, DollarSign, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: string;
  name: string;
  description?: string;
  price: number;
  location?: string;
  category?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PropertiesGridProps {
  initialProperties: Property[];
  isAdmin: boolean;
  hasMore: boolean;
  pageSize: number;
}

export function PropertiesGrid({
  initialProperties,
  isAdmin,
  hasMore: initialHasMore,
  pageSize,
}: PropertiesGridProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);

  const loadMore = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: newProperties, count } = await supabase
        .from("properties")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (newProperties) {
        setProperties([...properties, ...newProperties]);
        setPage(page + 1);
        setHasMore((count || 0) > (page + 1) * pageSize);
      }
    } catch (error) {
      console.error("Error loading more properties:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
                      <Link href={`/dashboard/properties/${property.id}/edit`}>
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

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            disabled={loading}
            size="lg"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Properties"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
