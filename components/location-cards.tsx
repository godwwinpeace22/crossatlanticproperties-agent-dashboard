"use client";

import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLocationsWithCounts } from "@/hooks/use-locations";
import Link from "next/link";

export function LocationCards() {
  const { locations, isLoading, error } = useLocationsWithCounts();

  const defaultImages = [
    "/lighthouse-by-the-ocean-with-blue-sky.jpg",
    "/sydney-opera-house-with-city-skyline-at-sunset.jpg",
    "/city-skyline-at-sunset-with-orange-and-purple-sky.jpg",
    "/tokyo-tower-with-modern-city-buildings.jpg",
    "/empire-state-building-and-new-york-skyline.jpg",
    "/berlin-tv-tower-with-modern-architecture-and-blue.jpg",
  ];

  if (isLoading) {
    return (
      <section className="py-10 sm:py-14 md:py-16 px-4 max-w-[1400px] mx-auto">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <p className="text-blue-600 font-medium text-sm tracking-wider uppercase mb-2">
            EXPLORE CITIES
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground text-balance">
            Our Location For You
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          {[...Array(6)].map((_, index) => (
            <Card
              key={index}
              className="overflow-hidden border-0 shadow-lg bg-white p-0"
            >
              <div className="h-56 sm:h-64 w-full bg-gray-200 animate-pulse" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-10 sm:py-14 md:py-16 px-4 max-w-[1400px] mx-auto">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <p className="text-blue-600 font-medium text-sm tracking-wider uppercase mb-2">
            EXPLORE CITIES
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground text-balance">
            Our Location For You
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-14 md:py-16 px-4 sm:max-w-[1400px] sm:mx-auto">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10 md:mb-12">
        <p className="text-blue-600 font-medium text-sm tracking-wider uppercase mb-2">
          EXPLORE CITIES
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground text-balance">
          Our Locations
        </h2>
      </div>

      {/* Location Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
        {locations.map((location, index) => (
          <Link key={location.id} href={`/properties?location=${location.id}`}>
            <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white p-0">
              <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                <img
                  src={
                    defaultImages[index % defaultImages.length] ||
                    "/placeholder.svg"
                  }
                  alt={`${location.name}, ${location.country}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-white/95 backdrop-blur-sm rounded-md p-3 sm:p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">
                          {location.propertyCount}{" "}
                          {location.propertyCount === 1
                            ? "Property"
                            : "Properties"}
                        </p>
                        <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                          {location.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 group-hover:bg-blue-600 transition-colors duration-300 shrink-0">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
