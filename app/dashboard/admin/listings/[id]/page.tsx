"use client";

import useSWR from "swr";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  Loader2,
  Trash2,
  Camera,
  Settings,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Property {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  purpose: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: string;
  yearBuilt?: number;
  garageSpaces?: number;
  amenities?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lastUpdated: string;
  images: Array<{
    id: number;
    url: string;
    isPrimary: boolean;
    category?: string;
  }>;
  views: number;
  inquiries: number;
}

// SWR fetcher function with proper error handling
const fetcher = async (url: string): Promise<Property> => {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    // Attach status for better error handling
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};

export default function ViewListingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [showVirtualTourManager, setShowVirtualTourManager] = useState(false);

  const listingId = params.id as string;

  // Use SWR for data fetching with caching
  const {
    data: listing,
    error,
    isLoading,
    mutate,
  } = useSWR<Property>(
    listingId ? `/api/listings/${listingId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute deduping
      errorRetryCount: 3,
      onError: (error) => {
        console.error("SWR Error:", error);
        // Handle authentication errors
        if (error.status === 401) {
          router.push("/login");
        }
      },
    }
  );

  const handleDeleteListing = async () => {
    if (!listing) return;

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete listing");
      }

      toast({
        title: "Listing deleted",
        description: `"${listing.title}" has been deleted successfully.`,
      });

      // Invalidate cache and redirect
      mutate();
      router.push("/dashboard/listings");
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading listing...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error.status === 403
        ? "You don't have permission to view this listing."
        : error.status === 404
        ? "Listing not found."
        : "Failed to load listing. Please try again.";

    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/listings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/listings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Listing not found.</p>
        </div>
      </div>
    );
  }

  const primaryImage =
    listing.images.find((img) => img.isPrimary) || listing.images[0];
  const amenitiesList = listing.amenities ? JSON.parse(listing.amenities) : [];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/listings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Listing Details</h1>
        <div className="ml-auto">
          <Link href={`/dashboard/listings/${listing.id}/edit`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Listing
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardContent className="p-0">
              {primaryImage && (
                <div className="relative">
                  <img
                    src={primaryImage.url}
                    alt={listing.title}
                    className="w-full h-96 object-cover rounded-t-lg"
                  />
                  {primaryImage.category && (
                    <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded capitalize">
                      {primaryImage.category}
                    </div>
                  )}
                </div>
              )}
              {listing.images.length > 1 && (
                <div className="p-4">
                  <h4 className="font-medium mb-3">
                    All Images ({listing.images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {listing.images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                        />
                        {image.category && (
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded capitalize">
                            {image.category}
                          </div>
                        )}
                        {image.isPrimary && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="font-semibold">{listing.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="font-semibold">{listing.bathrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Square Feet</p>
                  <p className="font-semibold">
                    {listing.squareFeet?.toLocaleString()}
                  </p>
                </div>
                {listing.lotSize && (
                  <div>
                    <p className="text-sm text-gray-500">Lot Size</p>
                    <p className="font-semibold">
                      {parseFloat(listing.lotSize).toLocaleString()} sq ft
                    </p>
                  </div>
                )}
                {listing.yearBuilt && (
                  <div>
                    <p className="text-sm text-gray-500">Year Built</p>
                    <p className="font-semibold">{listing.yearBuilt}</p>
                  </div>
                )}
                {listing.garageSpaces && listing.garageSpaces > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Garage Spaces</p>
                    <p className="font-semibold">{listing.garageSpaces}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Property Type</p>
                  <p className="font-semibold capitalize">{listing.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="font-semibold capitalize">{listing.purpose}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    className={
                      listing.status === "active"
                        ? "bg-green-500"
                        : listing.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }
                  >
                    {listing.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          {amenitiesList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {amenitiesList.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Virtual Tour Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Virtual Tour
              </CardTitle>
              <CardDescription>
                Manage 360° panoramic images for immersive property tours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Virtual tours help buyers explore your property remotely
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowVirtualTourManager(true)}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Virtual Tour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                }).format(Number(listing.price))}
              </CardTitle>
              <CardDescription className="text-lg">
                {listing.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {listing.address}, {listing.city}, {listing.state}{" "}
                  {listing.zipCode}
                </span>
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  Updated: {new Date(listing.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">Views</span>
                  </div>
                  <span className="font-semibold">{listing.views}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">Inquiries</span>
                  </div>
                  <span className="font-semibold">{listing.inquiries}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={`/dashboard/listings/${listing.id}/edit`}
                className="block"
              >
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Listing
                </Button>
              </Link>
              <ConfirmDialog
                title="Delete Listing"
                description={`Are you sure you want to delete "${listing.title}"? This action cannot be undone and will permanently remove the listing and all associated images.`}
                onConfirm={handleDeleteListing}
                confirmText="Delete"
                variant="destructive"
                trigger={
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Listing
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
