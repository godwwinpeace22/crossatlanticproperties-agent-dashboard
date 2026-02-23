"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
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
  category: string;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  created_at: string;
  images: PropertyImage[];
  primaryImage?: PropertyImage;
}

// Fetcher function for SWR
const fetchProperties = async (): Promise<Property[]> => {
  const supabase = createClient();

  // Fetch properties with images
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "available")
    .limit(6)
    .order("created_at", { ascending: false });

  if (propertiesError) throw propertiesError;

  if (!properties) return [];

  // Fetch images for each property
  const propertiesWithImages = await Promise.all(
    properties.map(async (property) => {
      const { data: images } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", property.id)
        .order("sort_order", { ascending: true });

      const primaryImage = images?.find((img) => img.isPrimary) || images?.[0];

      return {
        ...property,
        title: property.name || property.title,
        category: property.category,
        images: images || [],
        primaryImage,
      };
    }),
  );

  return propertiesWithImages;
};

export default function ImmersivePropertyShowcase() {
  const [currentPropertySet, setCurrentPropertySet] = useState(0);
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const PROPERTIES_PER_VIEW = 3;

  // Use SWR to fetch properties
  const {
    data: allProperties = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Property[]>("featured-properties", fetchProperties, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Cache for 1 minute
  });

  const isError = !!error;

  const categories = [
    { id: "all", label: "All Properties" },
    { id: "residential", label: "Residential" },
    { id: "commercial", label: "Commercial" },
    { id: "land", label: "Land" },
    { id: "luxury", label: "Luxury" },
  ];

  // Filter properties based on selected category
  const filterProperties = (category: string) => {
    if (category === "all") {
      setFeaturedProperties(allProperties);
    } else {
      const filtered = allProperties.filter(
        (property) => property.category === category,
      );
      setFeaturedProperties(filtered);
    }
    setCurrentPropertySet(0); // Reset to first page when filtering
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterProperties(category);
  };

  // Update featured properties when data loads or category changes
  useEffect(() => {
    filterProperties(selectedCategory);
  }, [allProperties, selectedCategory]);

  // Auto-slide images for each property
  useEffect(() => {
    if (featuredProperties.length > 0) {
      // Clear existing intervals
      Object.values(intervalRefs.current).forEach(clearInterval);
      intervalRefs.current = {};

      // Start new intervals for currently visible properties
      const startIndex = currentPropertySet * PROPERTIES_PER_VIEW;
      const endIndex = Math.min(
        startIndex + PROPERTIES_PER_VIEW,
        featuredProperties.length,
      );

      for (let i = startIndex; i < endIndex; i++) {
        const property = featuredProperties[i];
        if (property.images && property.images.length > 1) {
          intervalRefs.current[property.id] = setInterval(
            () => {
              setImageIndices((prev) => ({
                ...prev,
                [property.id]: (prev[property.id] + 1) % property.images.length,
              }));
            },
            4000 + (i - startIndex) * 1000,
          ); // Stagger the intervals
        }
      }
    }

    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, [currentPropertySet, featuredProperties]);

  const nextPropertySet = () => {
    const totalSets = Math.ceil(
      featuredProperties.length / PROPERTIES_PER_VIEW,
    );
    if (totalSets === 0) return;
    setCurrentPropertySet((prev) => (prev + 1) % totalSets);
  };

  const prevPropertySet = () => {
    const totalSets = Math.ceil(
      featuredProperties.length / PROPERTIES_PER_VIEW,
    );
    if (totalSets === 0) return;
    setCurrentPropertySet((prev) => (prev - 1 + totalSets) % totalSets);
  };

  const setImageIndex = (propertyId: string, index: number) => {
    setImageIndices((prev) => ({
      ...prev,
      [propertyId]: index,
    }));
  };

  // Calculate total pages for navigation
  const totalPages = Math.ceil(featuredProperties.length / PROPERTIES_PER_VIEW);

  // Get current properties to display
  const currentProperties = featuredProperties.slice(
    currentPropertySet * PROPERTIES_PER_VIEW,
    (currentPropertySet + 1) * PROPERTIES_PER_VIEW,
  );

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
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-text">Featured Properties</span>
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Unable to load properties at the moment. Please try again later.
            </p>
            <Button
              onClick={() => mutate()}
              className="bg-dnx-blue hover:bg-dnx-blue/90 text-white"
            >
              Try Again
            </Button>
            {process.env.NODE_ENV === "development" && error && (
              <p className="text-sm text-red-500 mt-4">
                Error: {error.message}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  const totalSets = Math.ceil(featuredProperties.length / PROPERTIES_PER_VIEW);

  // Helper functions to format data
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₦${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `₦${(price / 1000).toFixed(0)}K`;
    }
    return `₦${price.toLocaleString()}`;
  };

  const formatSquareFeet = (sqFt: number) => {
    return `${sqFt.toLocaleString()} sq ft`;
  };

  const getCategoryDisplay = (status: string) => {
    return status === "for_sale" ? "For Sale" : "For Rent";
  };

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            <span className="gradient-text">Featured Properties</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover our handpicked selection of premium properties
          </p>

          {/* Category Filter Pills */}
          <div className="flex justify-center flex-wrap gap-3 mb-8">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                className={`rounded-full px-6 py-2 transition-all duration-300 cursor-pointer ${
                  selectedCategory === category.id
                    ? "bg-blue-500 text-white shadow-lg scale-105"
                    : "border-gray-100 border-0 bg-gray-100 text-gray-500 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {featuredProperties.length === 0 && (
          <div className="max-w-2xl mx-auto rounded-2xl border-gray-200 bg-white p-8 text-center">
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedCategory === "all"
                ? "There are no available properties at the moment."
                : `No ${selectedCategory} properties are available right now.`}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {selectedCategory !== "all" && (
                <Button
                  onClick={() => handleCategoryChange("all")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  View All Properties
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* Properties Grid */}
          <div
            className={`grid gap-8 ${
              currentProperties.length === 1
                ? "lg:grid-cols-1 max-w-4xl mx-auto"
                : currentProperties.length === 2
                  ? "lg:grid-cols-2"
                  : "lg:grid-cols-3"
            }`}
          >
            {currentProperties.map((property, propertyIndex) => {
              const currentImageIndex = imageIndices[property.id] || 0;

              return (
                <div
                  key={property.id}
                  className="animate-slide-in-left border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow duration-300 overflow-hidden"
                  style={{ animationDelay: `${propertyIndex * 0.2}s` }}
                >
                  {/* Property Showcase */}
                  <div className="relative">
                    {/* Main Image */}
                    <div className="relative h-64 md:h-60 group">
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

                      {/* Badges at top */}
                      <div className="flex gap-2 mb-3 absolute top-5 left-5">
                        <Badge
                          variant={"default"}
                          className="bg-blue-500 text-white text-xs"
                        >
                          {property.category?.charAt(0)?.toUpperCase() +
                            property.category?.slice(1)}
                        </Badge>
                        <Badge className="bg-black/30 text-white text-xs">
                          {getCategoryDisplay(property.status)}
                        </Badge>
                      </div>

                      {/* Thumbnail Strip - positioned at bottom of image */}
                      {property.images && property.images.length > 1 && (
                        <div className="absolute bottom-4 left-4 flex space-x-2 z-20">
                          {property.images
                            .slice(0, 4)
                            .map((image: PropertyImage, index: number) => (
                              <button
                                key={index}
                                onClick={() =>
                                  setImageIndex(property.id, index)
                                }
                                className={`relative w-8 h-6 rounded overflow-hidden transition-all duration-300 ${
                                  index === currentImageIndex
                                    ? "ring-1 ring-white"
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
                            ))}
                          {property.images.length > 4 && (
                            <div className="relative w-8 h-6 rounded overflow-hidden bg-black/50 flex items-center justify-center">
                              <span className="text-xs text-white">
                                +{property.images.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute top-4 right-4 flex space-x-2 pointer-events-auto">
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

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 pointer-events-auto">
                          {property.images?.map((_, index: number) => (
                            <button
                              key={index}
                              onClick={() => setImageIndex(property.id, index)}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentImageIndex
                                  ? "bg-white"
                                  : "bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-4 space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <Link href={`/properties/${property.id}`}>
                          <h3 className="text-lg md:text-xl font-display font-bold text-gray-900 line-clamp-2 hover:text-dnx-blue transition-colors cursor-pointer">
                            {property.title}
                          </h3>
                        </Link>
                        <div className="text-lg font-bold text-dnx-blue whitespace-nowrap ml-2">
                          {formatPrice(property.price)}
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="h-4 w-4 mr-1 text-dnx-orange flex-shrink-0" />
                        <span className="text-sm truncate">
                          {property.city}, {property.state}
                        </span>
                      </div>

                      {/* Property Stats */}
                      <div className="flex items-center gap-4 mb-4">
                        {property.bedrooms && property.category !== "land" && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4 text-dnx-blue" />
                            <span className="font-semibold text-sm text-gray-900">
                              {property.bedrooms}
                            </span>
                            <span className="text-xs text-gray-600">Beds</span>
                          </div>
                        )}
                        {property.bathrooms && property.category !== "land" && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4 text-dnx-blue" />
                            <span className="font-semibold text-sm text-gray-900">
                              {property.bathrooms}
                            </span>
                            <span className="text-xs text-gray-600">Baths</span>
                          </div>
                        )}
                        {property.squareFeet && (
                          <div className="flex items-center gap-1">
                            <Maximize className="h-4 w-4 text-dnx-blue" />
                            <span className="font-semibold text-xs text-gray-900">
                              {new Intl.NumberFormat("en-US").format(
                                property.squareFeet,
                              )}
                            </span>
                            <span className="text-xs text-gray-600">sq ft</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          {featuredProperties.length > 0 && (
            <div className="flex justify-center items-center space-x-4 mt-12">
              <Button
                onClick={prevPropertySet}
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 border-dnx-blue/20 hover:bg-dnx-blue hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPropertySet(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentPropertySet
                        ? "bg-dnx-orange"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextPropertySet}
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 border-dnx-blue/20 hover:bg-dnx-blue hover:text-white"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
