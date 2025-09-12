"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  Bed,
  Heart,
  MapPin,
  Maximize,
  Eye,
  Share2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface PropertyImage {
  id: number;
  url: string;
  isPrimary: boolean;
  category?: string;
}

interface Property {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  location: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  property_type: string;
  propertyType: string;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  created_at: string;
  images: PropertyImage[];
  primaryImage?: PropertyImage;
}

export default function ImmersivePropertyShowcase() {
  const [currentProperty, setCurrentProperty] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch featured properties from Supabase
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Fetch properties with images
        const { data: properties, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .eq("status", "available")
          .limit(6)
          .order("created_at", { ascending: false });

        if (propertiesError) throw propertiesError;

        if (properties) {
          // Fetch images for each property
          const propertiesWithImages = await Promise.all(
            properties.map(async (property) => {
              const { data: images } = await supabase
                .from("property_images")
                .select("*")
                .eq("property_id", property.id)
                .order("sort_order", { ascending: true });

              const primaryImage =
                images?.find((img) => img.isPrimary) || images?.[0];

              return {
                ...property,
                title: property.name || property.title,
                propertyType: property.property_type,
                images: images || [],
                primaryImage,
              };
            })
          );

          setFeaturedProperties(propertiesWithImages);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Fetch featured properties using the custom hook
  // const {
  //   properties: featuredProperties,
  //   isLoading,
  //   isError,
  // } = useFeaturedProperties(6);
  // const featuredProperties: any[] = []; // MOCKED EMPTY FOR NOW
  // const isLoading = false;
  // const isError = false;

  useEffect(() => {
    if (isPlaying && featuredProperties.length > 0) {
      const currentPropertyData = featuredProperties[currentProperty];
      if (currentPropertyData?.images?.length > 0) {
        intervalRef.current = setInterval(() => {
          setCurrentImageIndex(
            (prev) => (prev + 1) % currentPropertyData.images.length
          );
        }, 4000);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentProperty, isPlaying, featuredProperties]);

  const nextProperty = () => {
    setCurrentProperty((prev) => (prev + 1) % featuredProperties.length);
    setCurrentImageIndex(0);
  };

  const prevProperty = () => {
    setCurrentProperty(
      (prev) =>
        (prev - 1 + featuredProperties.length) % featuredProperties.length
    );
    setCurrentImageIndex(0);
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-text">Featured Properties</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our handpicked selection of premium properties
            </p>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-dnx-blue" />
            <span className="ml-2 text-gray-600">Loading properties...</span>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (isError) {
    return (
      <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-text">Featured Properties</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our handpicked selection of premium properties with
              immersive virtual experiences
            </p>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 mb-4">Failed to load properties</p>
              <Button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // No properties state
  if (!featuredProperties.length) {
    return (
      <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-text">Featured Properties</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our handpicked selection of premium properties with
              immersive virtual experiences
            </p>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                No properties available at the moment
              </p>
              <Button asChild className="btn-primary">
                <Link href="/properties">Browse All Properties</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const property = featuredProperties[currentProperty];

  // Helper functions to format data
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatSquareFeet = (sqft: number) => {
    return new Intl.NumberFormat("en-US").format(sqft) + " sq ft";
  };

  const getPropertyTypeDisplay = (status: string) => {
    return status === "available"
      ? "Available"
      : status === "sold"
      ? "Sold"
      : status === "reserved"
      ? "Reserved"
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            <span className="gradient-text">Featured Properties</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our handpicked selection of premium properties with
            immersive virtual experiences
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Property Showcase */}
            <div className="space-y-6 animate-slide-in-left">
              <div className="relative">
                {/* Main Image */}
                <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden group">
                  <Image
                    src={
                      property.images?.[currentImageIndex]?.url ||
                      property.primaryImage?.url ||
                      "/placeholder.svg"
                    }
                    alt={property.title}
                    fill
                    className="object-cover property-image"
                  />

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="flex space-x-2">
                        {property.images?.map(
                          (_: PropertyImage, index: number) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === currentImageIndex
                                  ? "bg-white"
                                  : "bg-white/50"
                              }`}
                            />
                          )
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-effect border-white/30 text-white hover:bg-white/20"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-effect border-white/30 text-white hover:bg-white/20"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Property Type Badge */}
                  <Badge className="absolute top-4 left-4 bg-dnx-orange text-white">
                    {getPropertyTypeDisplay(property.status)}
                  </Badge>
                </div>

                {/* Thumbnail Strip */}
                {property.images && property.images.length > 1 && (
                  <div className="flex space-x-3 mt-4">
                    {property.images.map(
                      (image: PropertyImage, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative w-20 h-16 rounded-lg overflow-hidden transition-all duration-300 ${
                            index === currentImageIndex
                              ? "ring-2 ring-dnx-orange"
                              : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={image.url || "/placeholder.svg"}
                            alt={`${property.title} ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-8 animate-slide-in-right">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
                    {property.title}
                  </h3>
                  <div className="text-3xl font-bold text-dnx-blue">
                    {formatPrice(property.price)}
                  </div>
                </div>

                <div className="flex items-center text-gray-600 mb-6">
                  <MapPin className="h-5 w-5 mr-2 text-dnx-orange" />
                  <span className="text-lg">
                    {property.city}, {property.state}
                  </span>
                </div>

                {/* Property Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {property.bedrooms && property.propertyType !== "land" && (
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <Bed className="h-6 w-6 mx-auto mb-2 text-dnx-blue" />
                      <div className="font-semibold text-gray-900">
                        {property.bedrooms}
                      </div>
                      <div className="text-sm text-gray-600">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms && property.propertyType !== "land" && (
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <Bath className="h-6 w-6 mx-auto mb-2 text-dnx-blue" />
                      <div className="font-semibold text-gray-900">
                        {property.bathrooms}
                      </div>
                      <div className="text-sm text-gray-600">Bathrooms</div>
                    </div>
                  )}
                  {property.squareFeet && (
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <Maximize className="h-6 w-6 mx-auto mb-2 text-dnx-blue" />
                      <div className="font-semibold text-gray-900">
                        {formatSquareFeet(property.squareFeet)}
                      </div>
                      <div className="text-sm text-gray-600">Area</div>
                    </div>
                  )}
                </div>

                {/* Property Type & Description */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Property Type
                  </h4>
                  <Badge
                    variant="outline"
                    className="border-dnx-blue/20 text-dnx-blue mb-4"
                  >
                    {property.propertyType?.charAt(0)?.toUpperCase() +
                      property.propertyType?.slice(1)}
                  </Badge>
                  {property.description && (
                    <p className="text-gray-600 text-sm">
                      {property.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <Button asChild className="btn-primary">
                    <Link href={`/properties/${property.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center space-x-4 mt-12">
            <Button
              onClick={prevProperty}
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 border-dnx-blue/20 hover:bg-dnx-blue hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex space-x-2">
              {featuredProperties.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentProperty(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentProperty ? "bg-dnx-orange" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextProperty}
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 border-dnx-blue/20 hover:bg-dnx-blue hover:text-white"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
