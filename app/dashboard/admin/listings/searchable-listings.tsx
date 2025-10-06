"use client";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
  Eye,
  Edit,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface Listing {
  id: string | number; // Support both string (UUID) and number
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

interface SearchableListingsProps {
  initialListings: Listing[];
  counts: {
    all: number;
    active?: number;
    pending?: number;
    sold?: number;
    withdrawn?: number;
  };
  hasMore: boolean;
  pageSize: number;
}

export default function SearchableListings({
  initialListings,
  counts,
  hasMore: initialHasMore,
  pageSize,
}: SearchableListingsProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "price" | "updated">(
    "updated"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { toast } = useToast();

  // Load more listings function
  const loadMore = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: properties, count } = await supabase
        .from("properties")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (properties) {
        // Fetch images for new properties
        const propertyIds = properties.map((p) => p.id);
        const { data: images } = await supabase
          .from("property_images")
          .select("*")
          .in("property_id", propertyIds);

        const propertyImages = images || [];

        // Convert to listings format
        const newListings: Listing[] = properties.map((property: any) => {
          const propertyImageList = propertyImages.filter(
            (img) => img.property_id === property.id
          );
          const primaryImage =
            propertyImageList.find((img) => img.isPrimary) ||
            propertyImageList[0];

          return {
            id: property.id,
            title: property.name || "Untitled Property",
            address: property.location || "Address not specified",
            price: property.price.toString(),
            bedrooms: 0,
            bathrooms: 0,
            sqft: 0,
            status:
              property.status === "available" ? "active" : property.status,
            image: primaryImage?.url || "/placeholder.jpg",
            views: 0,
            inquiries: 0,
            lastUpdated: new Date(property.updated_at).toLocaleDateString(),
            category: property.category || "house",
            purpose: "sale",
            rentalStatus: property.status,
          };
        });

        setListings([...listings, ...newListings]);
        setPage(page + 1);
        setHasMore((count || 0) > (page + 1) * pageSize);
      }
    } catch (error) {
      console.error("Error loading more listings:", error);
      toast({
        title: "Error",
        description: "Failed to load more properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete listing function
  const deleteListing = async (listingId: string | number, title: string) => {
    try {
      const supabase = createClient();

      // First, get all images for this property to delete from storage
      const { data: images } = await supabase
        .from("property_images")
        .select("url")
        .eq("property_id", listingId);

      // Delete images from storage if they exist
      if (images && images.length > 0) {
        const imagePaths = images.map((img) => {
          const url = new URL(img.url);
          return url.pathname.replace(
            "/storage/v1/object/public/property-images/",
            ""
          );
        });

        if (imagePaths.length > 0) {
          await supabase.storage.from("property-images").remove(imagePaths);
        }
      }

      // Delete images from database
      await supabase
        .from("property_images")
        .delete()
        .eq("property_id", listingId);

      // Delete the property
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", listingId);

      if (error) {
        throw error;
      }

      toast({
        title: "Listing deleted",
        description: `"${title}" has been deleted successfully.`,
      });

      // Refresh the page to update the listings
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  // Filter listings based on search term
  const filteredListings = listings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort listings
  const sortedListings = [...filteredListings].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "price":
        // Remove currency symbols and convert to number
        aValue = parseFloat(a.price.replace(/[$,]/g, ""));
        bValue = parseFloat(b.price.replace(/[$,]/g, ""));
        break;
      case "updated":
        aValue = new Date(a.lastUpdated).getTime();
        bValue = new Date(b.lastUpdated).getTime();
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Helper function to render listing card
  const renderListingCard = (listing: Listing) => (
    <Card
      key={listing.id}
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 p-0"
    >
      <div className="relative">
        <img
          src={listing.image || "/placeholder.svg"}
          alt={listing.title}
          className="w-full h-48 object-cover"
        />
        <Badge
          className={`absolute top-3 right-3 ${
            listing.status === "active"
              ? "bg-green-500"
              : listing.status === "reserved"
              ? "bg-orange-500"
              : listing.status === "pending"
              ? "bg-yellow-500"
              : listing.status === "sold"
              ? "bg-blue-500"
              : "bg-gray-500"
          }`}
        >
          {listing.status}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{listing.title}</CardTitle>
        <CardDescription>{listing.address}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between mb-2">
          <span className="text-xl font-bold text-blue-600">
            {Number(listing.price.replace(/[$,]/g, "")).toLocaleString(
              "en-US",
              {
                style: "currency",
                currency: "NGN",
                maximumFractionDigits: 0,
              }
            )}
          </span>
          <div className="flex space-x-3 text-sm text-gray-500">
            {listing?.category != "land" && <span>{listing.bedrooms} bd</span>}
            {listing?.category != "land" && <span>{listing.bathrooms} ba</span>}
            {/* <span>{listing?.category == 'land' ? listing?.lotSize : listing.sqft} sqft</span> */}
          </div>
        </div>
        {/* <div className="flex justify-between text-sm text-gray-500">
          <span>{listing.views} views</span>
          <span>{listing.inquiries} inquiries</span>
        </div> */}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <div className="text-xs text-gray-500">
          Updated: {listing.lastUpdated}
        </div>
        <div className="flex space-x-2">
          {/* <Link href={`/dashboard/admin/listings/${listing.id}`}>
            <Button variant="ghost" size="sm" title="View listing">
              <Eye className="h-4 w-4" />
            </Button>
          </Link> */}
          <Link href={`/dashboard/admin/listings/${listing.id}/edit`}>
            <Button variant="ghost" size="sm" title="Edit listing">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <ConfirmDialog
            title="Delete Listing"
            description={`Are you sure you want to delete "${listing.title}"? This action cannot be undone and will permanently remove the listing and all associated images.`}
            onConfirm={() => deleteListing(listing.id, listing.title)}
            confirmText="Delete"
            variant="destructive"
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                title="Delete listing"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </CardFooter>
    </Card>
  );

  // Get filtered counts for each status
  const getFilteredCount = (status?: string) => {
    if (!status) return filteredListings.length;
    return filteredListings.filter((l) => l.status === status).length;
  };

  return (
    <>
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search by title, address, or property type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
          />
        </div>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split("-") as [
              typeof sortBy,
              typeof sortOrder
            ];
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
          }}
          className="px-3 py-2 border rounded-lg bg-white"
        >
          <option value="updated-desc">Latest Updated</option>
          <option value="updated-asc">Oldest Updated</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="title-asc">Title: A to Z</option>
          <option value="title-desc">Title: Z to A</option>
        </select>
      </div>

      {searchTerm && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Found {filteredListings.length} result
            {filteredListings.length !== 1 ? "s" : ""} for "{searchTerm}"
          </p>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="all">
            All Listings ({getFilteredCount()})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({getFilteredCount("active")})
          </TabsTrigger>
          <TabsTrigger value="reserved">
            Reserved ({getFilteredCount("reserved")})
          </TabsTrigger>
          <TabsTrigger value="sold">
            Sold ({getFilteredCount("sold")})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({getFilteredCount("pending")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedListings.map(renderListingCard)}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedListings
              .filter((l) => l.status === "active")
              .map(renderListingCard)}
          </div>
        </TabsContent>

        <TabsContent value="reserved">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedListings
              .filter((l) => l.status === "reserved")
              .map(renderListingCard)}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedListings
              .filter((l) => l.status === "pending")
              .map(renderListingCard)}
          </div>
        </TabsContent>

        <TabsContent value="sold">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedListings
              .filter((l) => l.status === "sold")
              .map(renderListingCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Load More Button */}
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
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
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
