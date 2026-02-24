"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { PropertyType } from "@/lib/types";

export function PropertyTypesShowcase() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [visibleCount] = useState(8); // Show 8 property types initially

  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  const fetchPropertyTypes = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("property_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setPropertyTypes(data || []);
    } catch (error) {
      console.error("Error fetching property types:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="section-padding bg-gradient-to-br from-green-500/5 to-blue-500/5">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-text">Estates</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl h-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (propertyTypes.length === 0) {
    return null;
  }

  const displayedPropertyTypes = showAll
    ? propertyTypes
    : propertyTypes.slice(0, visibleCount);

  const hasMoreItems = propertyTypes.length > visibleCount;

  return (
    <section className="section-padding bg-">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            <span className="gradient-text">Popular Estates</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover different types of properties available in our network of
            estates and developments.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedPropertyTypes.map((propertyType, index) => (
            <Link
              key={propertyType.id}
              href={`/property-types/${propertyType.id}`}
              className="group"
            >
              <div className="border rounded-xl overflow-hidden h-full transition-all duration-300 hover:shadow-sm hover:-translate-y-2">
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
                  <h3 className="text-xl font-bold mb-2 text-blue-900 group-hover:text-dnx-blue transition-colors duration-300">
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
          ))}
        </div>

        {!hasMoreItems && propertyTypes.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/property-types">
              <button className="inline-flex cursor-pointer items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                View All Estates
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
