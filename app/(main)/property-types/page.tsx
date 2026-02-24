"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { PropertyType } from "@/lib/types";

export default function PropertyTypesPage() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [filteredPropertyTypes, setFilteredPropertyTypes] = useState<
    PropertyType[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "created_at">("name");

  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  useEffect(() => {
    filterAndSortPropertyTypes();
  }, [propertyTypes, searchTerm, sortBy]);

  const fetchPropertyTypes = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("property_types")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setPropertyTypes(data || []);
    } catch (error) {
      console.error("Error fetching property types:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPropertyTypes = () => {
    let filtered = propertyTypes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (propertyType) =>
          propertyType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (propertyType.description &&
            propertyType.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    });

    setFilteredPropertyTypes(filtered);
  };

  const PropertyTypeCard = ({
    propertyType,
  }: {
    propertyType: PropertyType;
  }) => {
    if (viewMode === "list") {
      return (
        <Link
          href={`/property-types/${propertyType.id}`}
          className="group block"
        >
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-sm hover:-translate-y-1">
            <div className="flex">
              <div className="relative w-48 h-32 bg-gray-100 flex-shrink-0">
                {propertyType.image_url ? (
                  <Image
                    src={propertyType.image_url}
                    alt={propertyType.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-gray-400 text-sm font-medium">
                      {propertyType.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {propertyType.name}
                    </h3>
                    {propertyType.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 max-w-2xl">
                        {propertyType.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link href={`/property-types/${propertyType.id}`} className="group block">
        <div className="bg-white rounded-xl border overflow-hidden h-full transition-all duration-300 hover:shadow-sm hover:-translate-y-2">
          <div className="relative h-48 bg-gray-100">
            {propertyType.image_url ? (
              <Image
                src={propertyType.image_url}
                alt={propertyType.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="text-gray-400 text-lg font-medium">
                  {propertyType.name}
                </span>
              </div>
            )}
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
              {propertyType.name}
            </h3>
            {propertyType.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {propertyType.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index}>
                  <div className="bg-gray-200 rounded-xl h-64 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Estates
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl">
              Explore our diverse collection of estate developments. Find the
              perfect property category that matches your investment goals.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search property types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "created_at")
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="created_at">Sort by Newest</option>
              </select>

              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        {filteredPropertyTypes.length === 0 && !loading ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "No property types found"
                : "No property types available"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? `No property types match your search for "${searchTerm}"`
                : "There are currently no property types available."}
            </p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm("")}
                className="mt-4"
                variant="outline"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredPropertyTypes.length} of {propertyTypes.length}{" "}
                estates
              </p>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-4"
              }
            >
              {filteredPropertyTypes.map((propertyType) => (
                <PropertyTypeCard
                  key={propertyType.id}
                  propertyType={propertyType}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
