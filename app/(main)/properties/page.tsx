"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Building,
  Home,
  TreePine,
  Car,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property-card";
import { PropertyInterestWorkflow } from "@/components/property-interest-workflow";
import { createClient } from "@/lib/supabase/client";
import { Property, PropertyType, PropertyFilters } from "@/lib/types";

// Define constants
const PROPERTY_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
];

const PURPOSE_OPTIONS = [
  { value: "all", label: "All Purposes" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
];

const BEDROOM_OPTIONS = [
  { value: "all", label: "Any Bedrooms" },
  { value: "1", label: "1+ Bedrooms" },
  { value: "2", label: "2+ Bedrooms" },
  { value: "3", label: "3+ Bedrooms" },
  { value: "4", label: "4+ Bedrooms" },
  { value: "5", label: "5+ Bedrooms" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

export default function PropertiesPage() {
  const searchParams = useSearchParams();

  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPropertyType, setSelectedPropertyType] = useState("all");
  const [selectedPurpose, setSelectedPurpose] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedBeds, setSelectedBeds] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 3000000]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  // Locations state
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string; country: string }>
  >([]);

  // Interest workflow state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [isInterestWorkflowOpen, setIsInterestWorkflowOpen] = useState(false);

  // Handle property interest click
  const handlePropertyInterest = (property: Property) => {
    setSelectedProperty(property);
    setIsInterestWorkflowOpen(true);
  };

  // Load locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("locations")
          .select("id, name, country")
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get("category");
    const purpose = searchParams.get("purpose");
    const propertyType = searchParams.get("propertyType");
    const location = searchParams.get("location");
    const search = searchParams.get("search");

    if (category && category !== "all") setSelectedCategory(category);
    if (purpose && purpose !== "all") setSelectedPurpose(purpose);
    if (propertyType && propertyType !== "all")
      setSelectedPropertyType(propertyType);
    if (location && location !== "all") setSelectedLocation(location);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  // Fetch property types
  const { data: propertyTypes, error: propertyTypesError } = useSWR(
    "property-types",
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("property_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  );

  // Create cache key for SWR
  const cacheKey = useMemo(
    () => [
      "properties",
      searchQuery,
      selectedCategory,
      selectedPropertyType,
      selectedPurpose,
      selectedLocation,
      selectedBeds,
      priceRange,
      sortBy,
      currentPage,
    ],
    [
      searchQuery,
      selectedCategory,
      selectedPropertyType,
      selectedPurpose,
      selectedLocation,
      selectedBeds,
      priceRange,
      sortBy,
      currentPage,
    ],
  );

  // SWR fetcher function
  const fetchProperties = async () => {
    const supabase = createClient();

    let query = supabase.from("properties").select("*", { count: "exact" });

    // Apply filters
    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`,
      );
    }

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    if (selectedPropertyType !== "all") {
      query = query.eq("propertyType", selectedPropertyType);
    }

    if (selectedPurpose !== "all") {
      query = query.eq("purpose", selectedPurpose);
    }

    if (selectedLocation !== "all") {
      query = query.eq("location_id", selectedLocation);
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

    const { data: propertiesData, error: propertiesError, count } = await query;

    if (propertiesError) throw propertiesError;

    if (propertiesData) {
      // Fetch property types to map names
      const { data: propertyTypesData } = await supabase
        .from("property_types")
        .select("id, name");

      const propertyTypeMap = new Map(
        propertyTypesData?.map((type) => [type.id, type.name]) || [],
      );

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
            images: images || [],
            primaryImage,
            virtualTourEnabled: images && images.length > 0,
            propertyTypeName:
              propertyTypeMap.get(property.propertyType) || "Unknown",
          };
        }),
      );

      return {
        properties: propertiesWithImages,
        pagination: {
          total: count || 0,
          page: currentPage,
          limit,
          hasNextPage: count ? from + limit < count : false,
        },
      };
    }

    return { properties: [], pagination: null };
  };

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR(cacheKey, fetchProperties, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  });

  const properties = data?.properties || [];
  const pagination = data?.pagination;

  // Format price function
  const formatPrice = (price: number, purpose?: string) => {
    const formattedPrice = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);

    // Add "/month" suffix for rental properties
    if (purpose === "rent") {
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
    setSelectedCategory("all");
    setSelectedPropertyType("all");
    setSelectedPurpose("all");
    setSelectedLocation("all");
    setSelectedBeds("all");
    setPriceRange([0, 3000000]);
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedPropertyType,
    selectedPurpose,
    selectedLocation,
    selectedBeds,
    priceRange,
    sortBy,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
              Find Your Perfect Property
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Discover properties across Nigeria
            </p>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="bg-white py-6 border-b">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-3">
            {PROPERTY_CATEGORIES.slice(1).map((category) => (
              <Button
                key={category.value}
                variant={
                  selectedCategory === category.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="rounded-full"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80 bg-white rounded-lg shadow- border border-gray-200 h-fit">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Filters</h2>
              </div>

              <div className="space-y-6">
                {/* Search Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Properties
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, city, or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <Select
                    value={selectedPropertyType}
                    onValueChange={setSelectedPropertyType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Property Types</SelectItem>
                      {propertyTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Purpose Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <Select
                    value={selectedPurpose}
                    onValueChange={setSelectedPurpose}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSE_OPTIONS.map((purpose) => (
                        <SelectItem key={purpose.value} value={purpose.value}>
                          {purpose.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}, {location.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms
                  </label>
                  <Select value={selectedBeds} onValueChange={setSelectedBeds}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      {BEDROOM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="px-3">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={3000000}
                      min={0}
                      step={50000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>${(priceRange[0] / 1000).toFixed(0)}K</span>
                      <span>${(priceRange[1] / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Properties Content */}
          <div className="flex-1">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Properties {!isLoading && `(${pagination?.total || 0})`}
                </h2>
                <p className="text-gray-600">
                  Find your dream property from our exclusive listings
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
            {error && (
              <div className="text-center py-8">
                <p className="text-red-600">Error loading properties</p>
                <Button
                  onClick={() => mutate()}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!isLoading && !error && (
              <>
                {viewMode === "grid" ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        viewMode="grid"
                        onInterestClick={handlePropertyInterest}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        viewMode="list"
                        onInterestClick={handlePropertyInterest}
                      />
                    ))}
                  </div>
                )}

                {properties.length === 0 && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No properties found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search criteria or browse all
                      properties.
                    </p>
                    <Button onClick={handleClearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                )}

                {/* Load More */}
                {pagination?.hasNextPage && (
                  <div className="text-center py-8">
                    <Button onClick={handleLoadMore} variant="outline">
                      Load More Properties
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Property Interest Workflow */}
        {selectedProperty && (
          <PropertyInterestWorkflow
            property={selectedProperty}
            isOpen={isInterestWorkflowOpen}
            onClose={() => {
              setIsInterestWorkflowOpen(false);
              setSelectedProperty(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
