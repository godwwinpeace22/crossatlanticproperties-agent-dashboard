"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bath,
  Bed,
  Calendar,
  ChevronLeft,
  Eye,
  Heart,
  Home,
  MapPin,
  Maximize,
  Share2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PropertyGallery from "@/components/property-gallery";
import { createClient } from "@/lib/supabase/client";
// import { InterestButton } from "@/components/interest-button";
// import { FavoritesButton } from "@/components/favorites-button";
// import { ContactSellerButton } from "@/components/contact-seller-button";

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  status: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  virtual_tour_enabled?: boolean;
  property_images?: PropertyImage[];
}

interface PropertyImage {
  id: number;
  property_id: number;
  url: string;
  isPrimary: boolean;
}

export default function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const propertyId = params.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Fetch property data from Supabase
  const fetchProperty = async (id: string) => {
    try {
      const supabase = createClient();

      // Fetch main property data
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (propertyError) throw propertyError;

      // Fetch property images
      const { data: imagesData, error: imagesError } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", id)
        .order("isPrimary", { ascending: false });

      if (imagesError) throw imagesError;

      setProperty(propertyData);
      setPropertyImages(imagesData || []);

      // Fetch similar properties (same property type, excluding current property)
      if (propertyData) {
        const { data: similarData, error: similarError } = await supabase
          .from("properties")
          .select("*, property_images!inner(*)")
          .eq("property_type", propertyData.property_type)
          .eq("status", "available")
          .neq("id", id)
          .limit(3);

        if (!similarError && similarData) {
          setSimilarProperties(similarData);
        }

        // Fetch nearby properties (same city, excluding current property)
        const { data: nearbyData, error: nearbyError } = await supabase
          .from("properties")
          .select("*, property_images!inner(*)")
          .eq("city", propertyData.city)
          .eq("status", "available")
          .neq("id", id)
          .limit(3);

        if (!nearbyError && nearbyData) {
          setNearbyProperties(nearbyData);
        }
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchProperty(propertyId);
    }
  }, [propertyId]);

  // Helper functions to format data
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  const formatSquareFeet = (sqft: number) => {
    return new Intl.NumberFormat("en-US").format(sqft) + " sq ft";
  };

  const getPropertyTypeDisplay = (status: string) => {
    return status === "available"
      ? "For Sale"
      : status === "sold"
      ? "Sold"
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get primary image or first image
  const getPrimaryImage = (images: PropertyImage[]) => {
    const primary = images.find((img) => img.isPrimary);
    return primary?.url || images[0]?.url || "/placeholder.svg";
  };

  // Get all image URLs for gallery
  const getAllImageUrls = (images: PropertyImage[]) => {
    return images.map((img) => img.url);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <div className="container px-4 py-6 md:px-6 md:py-8">
            <Button variant="ghost" size="sm" asChild className="mb-6">
              <Link href="/properties" className="flex items-center">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Link>
            </Button>
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-dnx-blue" />
              <span className="ml-2 text-gray-600">Loading property...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !property) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <div className="container px-4 py-6 md:px-6 md:py-8">
            <Button variant="ghost" size="sm" asChild className="mb-6">
              <Link href="/properties" className="flex items-center">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Link>
            </Button>
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <p className="text-red-600 mb-4">
                  Property not found or failed to load
                </p>
                <Button asChild>
                  <Link href="/properties">Browse All Properties</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/properties" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Link>
          </Button>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge>{getPropertyTypeDisplay(property.status)}</Badge>
                    <div className="flex items-center gap-2">
                      {/* <FavoritesButton propertyId={property.id} /> */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">Share property</span>
                      </Button>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold">{property.title}</h1>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>
                      {property.city}, {property.state}
                    </span>
                  </div>
                </div>

                <PropertyGallery images={getAllImageUrls(propertyImages)} />

                <div className="grid gap-4 md:grid-cols-4">
                  {property.property_type !== "land" && (
                    <>
                      <div className="flex flex-col items-center p-4 border rounded-lg">
                        <Bed className="h-5 w-5 text-primary mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Bedrooms
                        </span>
                        <span className="font-medium">
                          {property.bedrooms || 0}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-4 border rounded-lg">
                        <Bath className="h-5 w-5 text-primary mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Bathrooms
                        </span>
                        <span className="font-medium">
                          {property.bathrooms || 0}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <Maximize className="h-5 w-5 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Area</span>
                    <span className="font-medium">
                      {formatSquareFeet(property.square_feet || 0)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <Calendar className="h-5 w-5 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Listed
                    </span>
                    <span className="font-medium">
                      {new Date(property.created_at).getFullYear()}
                    </span>
                  </div>
                </div>

                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4 pt-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Description
                      </h3>
                      <p className="text-muted-foreground">
                        {property.description}
                      </p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="font-medium">Property Details</h4>
                        <ul className="mt-2 space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">
                              Property ID
                            </span>
                            <span className="font-medium">#{property.id}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">
                              Property Type
                            </span>
                            <span className="font-medium">
                              {property.property_type.charAt(0).toUpperCase() +
                                property.property_type.slice(1)}
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">
                              Property Status
                            </span>
                            <span className="font-medium">
                              {getPropertyTypeDisplay(property.status)}
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">
                              Listed Date
                            </span>
                            <span className="font-medium">
                              {new Date(
                                property.created_at
                              ).toLocaleDateString()}
                            </span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium">Additional Details</h4>
                        <ul className="mt-2 space-y-2 text-sm">
                          {property.property_type !== "land" && (
                            <>
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Bedrooms
                                </span>
                                <span className="font-medium">
                                  {property.bedrooms || 0}
                                </span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Bathrooms
                                </span>
                                <span className="font-medium">
                                  {property.bathrooms || 0}
                                </span>
                              </li>
                            </>
                          )}
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">
                              Square Feet
                            </span>
                            <span className="font-medium">
                              {formatSquareFeet(property.square_feet || 0)}
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">
                              Lot Size
                            </span>
                            <span className="font-medium">
                              {property.lot_size
                                ? `${property.lot_size} sq ft`
                                : "N/A"}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="features" className="pt-4">
                    <h3 className="text-xl font-semibold mb-4">
                      Property Features
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                      <div className="flex items-center">
                        <Home className="h-4 w-4 text-primary mr-2" />
                        <span>
                          {property.property_type.charAt(0).toUpperCase() +
                            property.property_type.slice(1)}
                        </span>
                      </div>
                      {property.property_type !== "land" && (
                        <>
                          <div className="flex items-center">
                            <Home className="h-4 w-4 text-primary mr-2" />
                            <span>{property.bedrooms || 0} Bedrooms</span>
                          </div>
                          <div className="flex items-center">
                            <Home className="h-4 w-4 text-primary mr-2" />
                            <span>{property.bathrooms || 0} Bathrooms</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center">
                        <Home className="h-4 w-4 text-primary mr-2" />
                        <span>
                          {formatSquareFeet(property.square_feet || 0)}
                        </span>
                      </div>
                      {property.lot_size && (
                        <div className="flex items-center">
                          <Home className="h-4 w-4 text-primary mr-2" />
                          <span>{property.lot_size} sq ft lot</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="neighborhood" className="space-y-4 pt-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Neighborhood
                      </h3>
                      <p className="text-muted-foreground">
                        {property.city}, {property.state} {property.zip_code}
                      </p>
                      <p className="text-muted-foreground mt-2">
                        Full address: {property.address}
                      </p>
                    </div>
                    <Separator />
                    {property.latitude && property.longitude && (
                      <div className="aspect-video overflow-hidden rounded-lg border">
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <p className="text-gray-500">
                            Map view would be displayed here
                          </p>
                          <p className="text-xs text-gray-400 ml-2">
                            ({property.latitude}, {property.longitude})
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-primary">
                    {formatPrice(property.price)}
                  </h2>
                </div>
                {/* <Separator className="my-4" />
                <div className="space-y-4">
                  {property.agent ? (
                    <>
                      <div className="flex items-center">
                        <div className="mr-4">
                          <div className="w-16 h-16 bg-dnx-blue text-white rounded-full flex items-center justify-center">
                            {property.agent.name.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {property.agent.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Real Estate Agent
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {property.agent.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="w-full">
                          Call Agent
                        </Button>
                        <Button variant="outline" className="w-full">
                          Email
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        Contact information not available
                      </p>
                    </div>
                  )}
                </div> */}
              </div>
              {/* <InterestButton
                propertyId={property.id}
                propertyPrice={Number(property.price)}
                agentId={property.agent?.id!}
                propertyTitle={property?.title}
                className="rounded-lg border"
              /> */}
            </div>
          </div>

          {/* Similar Properties Section */}
          {similarProperties.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Similar Properties</h2>
                <Button variant="outline" asChild>
                  <Link
                    href={`/properties?propertyType=${property.property_type}`}
                  >
                    View More
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {similarProperties.slice(0, 3).map((similarProp) => (
                  <div key={similarProp.id} className="group cursor-pointer">
                    <Link href={`/properties/${similarProp.id}`}>
                      <div className="relative overflow-hidden rounded-lg">
                        <Image
                          src={getPrimaryImage(
                            similarProp.property_images || []
                          )}
                          alt={similarProp.title}
                          width={400}
                          height={300}
                          className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-dnx-orange text-white">
                            {getPropertyTypeDisplay(similarProp.status)}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg group-hover:text-dnx-blue transition-colors">
                            {similarProp.title}
                          </h3>
                          <span className="text-xl font-bold text-dnx-blue">
                            {formatPrice(similarProp.price)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {similarProp.city}, {similarProp.state}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {similarProp.property_type !== "land" && (
                            <>
                              <div className="flex items-center">
                                <Bed className="h-4 w-4 mr-1" />
                                <span>{similarProp.bedrooms || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Bath className="h-4 w-4 mr-1" />
                                <span>{similarProp.bathrooms || 0}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center">
                            <Maximize className="h-4 w-4 mr-1" />
                            <span>
                              {formatSquareFeet(similarProp.square_feet || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Properties Section */}
          {nearbyProperties.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Nearby Properties</h2>
                <Button variant="outline" asChild>
                  <Link
                    href={`/properties?city=${property.city}&state=${property.state}`}
                  >
                    View More
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {nearbyProperties.slice(0, 3).map((nearbyProp) => (
                  <div key={nearbyProp.id} className="group cursor-pointer">
                    <Link href={`/properties/${nearbyProp.id}`}>
                      <div className="relative overflow-hidden rounded-lg">
                        <Image
                          src={getPrimaryImage(
                            nearbyProp.property_images || []
                          )}
                          alt={nearbyProp.title}
                          width={400}
                          height={300}
                          className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-dnx-orange text-white">
                            {getPropertyTypeDisplay(nearbyProp.status)}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg group-hover:text-dnx-blue transition-colors">
                            {nearbyProp.title}
                          </h3>
                          <span className="text-xl font-bold text-dnx-blue">
                            {formatPrice(nearbyProp.price)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {nearbyProp.city}, {nearbyProp.state}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {nearbyProp.property_type !== "land" && (
                            <>
                              <div className="flex items-center">
                                <Bed className="h-4 w-4 mr-1" />
                                <span>{nearbyProp.bedrooms || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Bath className="h-4 w-4 mr-1" />
                                <span>{nearbyProp.bathrooms || 0}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center">
                            <Maximize className="h-4 w-4 mr-1" />
                            <span>
                              {formatSquareFeet(nearbyProp.square_feet || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
