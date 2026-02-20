import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import SearchableListings from "./searchable-listings";
import { createClient } from "@/lib/supabase/server";
import { isAdminOrManager } from "@/lib/roles";

// Cache for 3 minutes
export const revalidate = 180;

// Types for our properties from Supabase (based on the actual table structure)
interface Property {
  id: string; // UUID in the database
  name: string;
  description?: string;
  price: number;
  location?: string;
  category?: string;
  status: string; // 'available', 'sold', 'reserved'
  created_at: string;
  updated_at: string;
}

// Convert Property to Listing format for the existing component
interface Listing {
  id: string; // Changed to string to match UUID
  title: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  status: string;
  image: string;
  views: number;
  inquiries: number;
  lastUpdated: string;
  category: string;
  purpose: string;
  rentalStatus?: string;
}

interface ListingsResponse {
  listings: Listing[];
  counts: {
    all: number;
    active?: number;
    pending?: number;
    sold?: number;
    withdrawn?: number;
    available?: number;
  };
  user: {
    id: string;
    accountType: string;
    name: string;
  };
}

async function getListings(
  page: number = 1,
  pageSize: number = 12,
): Promise<ListingsResponse & { totalPages: number; currentPage: number }> {
  const supabase = await createClient();

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .single();

    if (!isAdminOrManager(profile?.role)) {
      redirect("/dashboard");
    }

    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch total count
    const { count: totalCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true });

    // Fetch properties from Supabase with pagination
    const { data: properties, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching properties:", error);
      throw error;
    }

    // Fetch property images separately
    let propertyImages: any[] = [];
    if (properties && properties.length > 0) {
      const propertyIds = properties.map((p) => p.id);
      const { data: images } = await supabase
        .from("property_images")
        .select("*")
        .in("property_id", propertyIds);

      propertyImages = images || [];
    }

    // Convert properties to listings format
    const listings: Listing[] = (properties || []).map((property: Property) => {
      // Find images for this property
      const propertyImageList = propertyImages.filter(
        (img) => img.property_id === property.id,
      );

      // Find the primary image or fallback to first image
      const primaryImage =
        propertyImageList.find((img) => img.isPrimary) || propertyImageList[0];

      return {
        id: property.id,
        title: property.name || "Untitled Property",
        address: property.location || "Address not specified",
        price: property.price.toString(),
        bedrooms: 0, // Not available in basic properties table
        bathrooms: 0, // Not available in basic properties table
        sqft: 0, // Not available in basic properties table
        status: property.status === "available" ? "active" : property.status, // Map available to active for UI compatibility
        image: primaryImage?.url || "/placeholder.jpg",
        views: 0, // Placeholder - would need to implement analytics
        inquiries: 0, // Placeholder - would need to implement inquiries tracking
        lastUpdated: new Date(property.updated_at).toLocaleDateString(),
        category: property.category || "house",
        purpose: "sale", // Default purpose since it's not in the basic table
        rentalStatus: property.status,
      };
    });

    // Calculate counts by status
    const counts = {
      all: listings.length,
      available: listings.filter((l) => l.status === "available").length,
      sold: listings.filter((l) => l.status === "sold").length,
      reserved: listings.filter((l) => l.status === "reserved").length,
      active: listings.filter((l) => l.status === "available").length, // Map available to active for UI compatibility
      pending: listings.filter((l) => l.status === "reserved").length, // Map reserved to pending for UI compatibility
      withdrawn: 0, // Not a valid status in our schema
    };

    const totalPages = Math.ceil((totalCount || 0) / pageSize);

    return {
      listings,
      counts,
      user: {
        id: user.id,
        accountType: profile?.account_type || "agent",
        name: profile?.full_name || user.email || "User",
      },
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching listings:", error);
    // Return empty data structure for error handling
    return {
      listings: [],
      counts: { all: 0 },
      user: { id: "", accountType: "", name: "" },
      totalPages: 0,
      currentPage: 1,
    };
  }
}

export default async function ListingsPage() {
  const pageSize = 12;
  const data = await getListings(1, pageSize);
  const { listings, counts, user, totalPages } = data;
  const hasMore = totalPages > 1;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
        </div>
        <Link href="/dashboard/admin/listings/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add New Property
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No listings found.</p>
          <p className="text-gray-400 mt-2">
            Start by creating your first property listing!
          </p>
        </div>
      ) : (
        <Suspense fallback={<div>Loading listings...</div>}>
          <SearchableListings
            initialListings={listings}
            counts={counts}
            hasMore={hasMore}
            pageSize={pageSize}
          />
        </Suspense>
      )}
    </div>
  );
}
