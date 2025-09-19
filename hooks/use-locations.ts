import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

export interface Location {
  id: string;
  name: string;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationWithCount extends Location {
  propertyCount: number;
}

// Fetcher function for locations
const fetchLocations = async (url: string) => {
  const supabase = createClient();

  if (url === "/api/locations") {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return data || [];
  }

  if (url === "/api/locations/with-counts") {
    // First fetch locations
    const { data: locationsData, error: locationsError } = await supabase
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (locationsError) throw locationsError;

    if (!locationsData) return [];

    // Then fetch property counts for each location
    const locationsWithCounts = await Promise.all(
      locationsData.map(async (location) => {
        const { count, error: countError } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("location_id", location.id)
          .eq("status", "available");

        if (countError) {
          console.error(
            `Error counting properties for ${location.name}:`,
            countError
          );
          return {
            ...location,
            propertyCount: 0,
          };
        }

        return {
          ...location,
          propertyCount: count || 0,
        };
      })
    );

    return locationsWithCounts;
  }

  throw new Error(`Unknown URL: ${url}`);
};

// Hook for basic locations (used in header, forms, etc.)
export const useLocations = () => {
  const { data, error, isLoading, mutate } = useSWR<Location[]>(
    "/api/locations",
    fetchLocations,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Cache for 5 seconds
    }
  );

  return {
    locations: data || [],
    isLoading,
    error,
    mutate,
  };
};

// Hook for locations with property counts (used in location cards)
export const useLocationsWithCounts = () => {
  const { data, error, isLoading, mutate } = useSWR<LocationWithCount[]>(
    "/api/locations/with-counts",
    fetchLocations,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Cache for 10 seconds (longer since counts change less frequently)
    }
  );

  return {
    locations: data || [],
    isLoading,
    error,
    mutate,
  };
};
