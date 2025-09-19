"use client";

import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLocationsWithCounts } from "@/hooks/use-locations";

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
      <section className="py-16 px-4 max-w-[1400px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-medium text-sm tracking-wider uppercase mb-2">
            EXPLORE CITIES
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
            Our Location For You
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card
              key={index}
              className="overflow-hidden border-0 shadow-lg bg-white p-0"
            >
              <div className="h-64 w-full bg-gray-200 animate-pulse" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 max-w-[1400px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-medium text-sm tracking-wider uppercase mb-2">
            EXPLORE CITIES
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
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
    <section className="py-16 px-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-blue-600 font-medium text-sm tracking-wider uppercase mb-2">
          EXPLORE CITIES
        </p>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
          Our Locations
        </h2>
      </div>

      {/* Location Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {locations.map((location, index) => (
          <Card
            key={location.id}
            className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white p-0"
            onClick={() => {
              // Navigate to properties page filtered by this location
              window.location.href = `/properties?location=${location.id}`;
            }}
          >
            {/* Image Container with Overlay Content - Full Card Height */}
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src={
                  defaultImages[index % defaultImages.length] ||
                  "/placeholder.svg"
                }
                alt={`${location.name}, ${location.country}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Content Card Overlay with Reduced Padding */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-white/95 backdrop-blur-sm rounded-md p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        {location.propertyCount}{" "}
                        {location.propertyCount === 1
                          ? "Property"
                          : "Properties"}
                      </p>
                      <h3 className="text-base font-semibold text-foreground">
                        {location.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-600 transition-colors duration-300">
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
