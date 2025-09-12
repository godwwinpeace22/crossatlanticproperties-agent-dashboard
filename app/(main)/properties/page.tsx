"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Heart,
  Eye,
  ArrowRight,
  Grid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/client";
// import { FavoritesButton } from "@/components/favorites-button";

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
  purpose: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  created_at: string;
  images: PropertyImage[];
  primaryImage?: PropertyImage;
  virtualTourEnabled?: boolean;
}

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 3000000]);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBeds, setSelectedBeds] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Supabase data fetching states
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
  } | null>(null);

  // Fetch properties from Supabase
  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const supabase = createClient();

      let query = supabase.from("properties").select("*", { count: "exact" });

      // Apply filters
      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`
        );
      }

      if (selectedCategory !== "all") {
        query = query.eq("property_type", selectedCategory);
      }

      if (selectedBeds !== "all") {
        query = query.gte("bedrooms", parseInt(selectedBeds));
      }

      if (priceRange[0] > 0) {
        query = query.gte("price", priceRange[0]);
      }

      if (priceRange[1] < 3000000) {
        query = query.lte("price", priceRange[1]);
      }

      // Apply sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "price_low") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price_high") {
        query = query.order("price", { ascending: false });
      }

      // Apply pagination
      const limit = 12;
      const from = (currentPage - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const {
        data: propertiesData,
        error: propertiesError,
        count,
      } = await query;

      if (propertiesError) throw propertiesError;

      if (propertiesData) {
        // Fetch images for each property
        const propertiesWithImages = await Promise.all(
          propertiesData.map(async (property) => {
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
              virtualTourEnabled: images && images.length > 0, // Assuming properties with images have virtual tours
            };
          })
        );

        setProperties(propertiesWithImages);

        // Set pagination info
        setPagination({
          total: count || 0,
          page: currentPage,
          limit,
          hasNextPage: count ? from + limit < count : false,
        });
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch properties when filters change
  useEffect(() => {
    fetchProperties();
  }, [
    searchQuery,
    selectedType,
    selectedCategory,
    selectedBeds,
    priceRange,
    sortBy,
    currentPage,
  ]);

  // Build API parameters from current filters (kept for compatibility)
  const apiParams = {
    search: searchQuery || undefined,
    status:
      selectedType === "all"
        ? "active"
        : selectedType === "sale"
        ? "for_sale"
        : "for_rent",
    propertyType: selectedCategory === "all" ? undefined : selectedCategory,
    bedrooms: selectedBeds === "all" ? undefined : parseInt(selectedBeds),
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 3000000 ? priceRange[1] : undefined,
    page: currentPage,
    limit: 12,
    sortBy:
      sortBy === "newest"
        ? "listingDate"
        : sortBy === "popular"
        ? "listingDate"
        : "price",
    sortOrder: sortBy === "price_low" ? "asc" : "desc",
  };

  // Fetch properties using the custom hook
  // const { properties, pagination, isLoading, isError, mutate } =
  //   useProperties(apiParams);

  useEffect(() => {
    // Get initial filters from URL params
    const type = searchParams.get("type") || "all";
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";

    setSelectedType(type);
    setSelectedCategory(category);
    setSearchQuery(search);
  }, [searchParams]);

  // Helper functions to format data
  const formatPrice = (price: number, purpose?: string) => {
    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

    // Add "/month" suffix for rental properties
    if (purpose === "rental") {
      return `${formattedPrice}/month`;
    }

    return formattedPrice;
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

  const handleLoadMore = () => {
    if (pagination?.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedCategory("all");
    setSelectedBeds("all");
    setPriceRange([0, 3000000]);
    setCurrentPage(1);
  };

  // Loading state
  if (isLoading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-dnx-blue to-dnx-orange text-white py-16">
          <div className="container-custom">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
                Find Your Perfect Property
              </h1>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Discover premium properties across Africa with our advanced
                search and virtual tour technology
              </p>
            </div>
          </div>
        </section>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading properties...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-dnx-blue to-dnx-orange text-white py-16">
          <div className="container-custom">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
                Find Your Perfect Property
              </h1>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Discover premium properties across Africa with our advanced
                search and virtual tour technology
              </p>
            </div>
          </div>
        </section>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load properties</p>
            <Button onClick={() => fetchProperties()} className="btn-primary">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-orange-500 text-white py-16">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
              Find Your Perfect Property
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Discover premium properties across Africa with our advanced search
              and virtual tour technology
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="glass-effect rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="form-select text-gray-900">
                    <SelectValue placeholder="Buy/Rent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="form-select text-gray-900">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedBeds} onValueChange={setSelectedBeds}>
                  <SelectTrigger className="form-select text-gray-900">
                    <SelectValue placeholder="Bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Bedrooms</SelectItem>
                    <SelectItem value="1">1+ Bedrooms</SelectItem>
                    <SelectItem value="2">2+ Bedrooms</SelectItem>
                    <SelectItem value="3">3+ Bedrooms</SelectItem>
                    <SelectItem value="4">4+ Bedrooms</SelectItem>
                    <SelectItem value="5">5+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white" />
                  <Input
                    type="text"
                    placeholder="Location or Property ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input pl-10 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-white/30 text-black hover:bg-white/20"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Advanced Filters
                </Button>

                <Button className="btn-secondary">
                  <Search className="mr-2 h-5 w-5" />
                  Search Properties
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <section className="bg-white border-b border-gray-200 py-6">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ${priceRange[0].toLocaleString()} - $
                  {priceRange[1].toLocaleString()}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={3000000}
                  min={0}
                  step={50000}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  {[
                    "Virtual Tour",
                    "Swimming Pool",
                    "Garden",
                    "Parking",
                    "Security",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox id={feature} />
                      <label
                        htmlFor={feature}
                        className="text-sm text-gray-600"
                      >
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Size
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Size</SelectItem>
                    <SelectItem value="small">Under 1,000 sq ft</SelectItem>
                    <SelectItem value="medium">1,000 - 2,500 sq ft</SelectItem>
                    <SelectItem value="large">2,500 - 5,000 sq ft</SelectItem>
                    <SelectItem value="xlarge">Over 5,000 sq ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      <section className="section-padding">
        <div className="container-custom">
          {/* Results Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {pagination?.total || properties.length} Properties Found
              </h2>
              <p className="text-gray-600 mt-1">
                {pagination
                  ? `Showing ${
                      (pagination.page - 1) * pagination.limit + 1
                    }-${Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )} of ${pagination.total} results`
                  : "Showing results for your search criteria"}
              </p>
            </div>

            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border border-gray-200 rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Properties Grid/List */}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-6"
            }
          >
            {properties.map((property) => (
              <div
                key={property.id}
                className={`property-card ${viewMode === "list" ? "flex" : ""}`}
              >
                <div
                  className={`relative ${
                    viewMode === "list" ? "w-80 h-60" : "h-64"
                  } overflow-hidden`}
                >
                  <Image
                    src={
                      property.primaryImage?.url ||
                      property.images?.[0]?.url ||
                      "/placeholder.svg"
                    }
                    alt={property.title}
                    fill
                    className="object-cover property-image"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="flex space-x-2">
                        {/* <FavoritesButton propertyId={property.id} /> */}
                        {property.virtualTourEnabled && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="glass-effect border-white/30 text-white hover:bg-white/20"
                          >
                            <Link href={`/virtual-tours/${property.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Virtual Tour
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col space-y-2">
                    <Badge
                      className={
                        property.status === "available"
                          ? "bg-dnx-blue"
                          : "bg-dnx-orange"
                      }
                    >
                      {getPropertyTypeDisplay(property.status)}
                    </Badge>
                    {property.virtualTourEnabled && (
                      <Badge
                        variant="outline"
                        className="bg-white/90 text-gray-900"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Virtual Tour
                      </Badge>
                    )}
                  </div>
                </div>

                <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className="mb-3">
                    <Link href={`/properties/${property.id}`}>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
                        {property.title}
                      </h3>
                    </Link>
                    <div className="text-base font-bold text-dnx-blue">
                      {formatPrice(property.price, property.purpose)}
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-1 text-dnx-orange" />
                    <span>
                      {property.city}, {property.state}
                    </span>
                  </div>

                  {/* Property Details */}
                  <div className="flex items-center space-x-6 mb-4 text-sm text-gray-600">
                    {property.bedrooms && property.propertyType !== "land" && (
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        <span>{property.bedrooms} beds</span>
                      </div>
                    )}
                    {property.bathrooms && property.propertyType !== "land" && (
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        <span>{property.bathrooms} baths</span>
                      </div>
                    )}
                    {property.squareFeet && (
                      <div className="flex items-center">
                        <Maximize className="h-4 w-4 mr-1" />
                        <span>
                          {property.squareFeet.toLocaleString()} sq ft
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Property Type */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      {property.propertyType?.charAt(0)?.toUpperCase() +
                        property.propertyType?.slice(1)}
                    </Badge>
                    {property.description && (
                      <Badge variant="outline" className="text-xs">
                        Details Available
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {pagination?.hasNextPage && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="min-w-40"
              >
                {isLoading ? "Loading..." : "Load More Properties"}
              </Button>
            </div>
          )}

          {/* No Results */}
          {properties.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No Properties Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or browse all properties.
                </p>
                <Button onClick={handleClearFilters} className="btn-primary">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PropertiesContent />
    </Suspense>
  );
}
