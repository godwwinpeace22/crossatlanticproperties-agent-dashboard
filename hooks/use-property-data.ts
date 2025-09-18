import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  category: string;
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
  floor_plan_url?: string;
}

interface PropertyImage {
  id: number;
  property_id: number;
  url: string;
  isPrimary: boolean;
}

interface PropertyWithFavorite extends Property {
  isFavorite?: boolean;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const supabase = createClient();

  if (url.startsWith("/api/property/")) {
    const propertyId = url.split("/").pop();

    // Fetch main property data
    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propertyError) throw propertyError;

    return propertyData;
  }

  if (url.startsWith("/api/property-images/")) {
    const propertyId = url.split("/").pop();

    // Fetch property images
    const { data: imagesData, error: imagesError } = await supabase
      .from("property_images")
      .select("*")
      .eq("property_id", propertyId)
      .order("isPrimary", { ascending: false });

    if (imagesError) throw imagesError;

    return imagesData || [];
  }

  if (url.startsWith("/api/similar-properties/")) {
    const [propertyId, category] = url.split("/").slice(-2);

    const { data: similarData, error: similarError } = await supabase
      .from("properties")
      .select("*, property_images!inner(*)")
      .eq("category", category)
      .eq("status", "available")
      .neq("id", propertyId)
      .limit(3);

    if (similarError) throw similarError;

    return similarData || [];
  }

  if (url.startsWith("/api/nearby-properties/")) {
    const [propertyId, city] = url.split("/").slice(-2);

    const { data: nearbyData, error: nearbyError } = await supabase
      .from("properties")
      .select("*, property_images!inner(*)")
      .eq("city", city)
      .eq("status", "available")
      .neq("id", propertyId)
      .limit(3);

    if (nearbyError) throw nearbyError;

    return nearbyData || [];
  }

  if (url.startsWith("/api/favorite-status/")) {
    const propertyId = url.split("/").pop();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: favoriteData } = await supabase
      .from("favorites")
      .select("id")
      .eq("property_id", propertyId)
      .eq("user_id", user.id)
      .single();

    return !!favoriteData;
  }

  throw new Error(`Unknown API endpoint: ${url}`);
};

// Custom hooks for different data
export function useProperty(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/property/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    property: data as Property | undefined,
    isLoading,
    error,
    mutate,
  };
}

export function usePropertyImages(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/property-images/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    images: data as PropertyImage[] | undefined,
    isLoading,
    error,
  };
}

export function useSimilarProperties(id: string, category: string) {
  const { data, error, isLoading } = useSWR(
    id && category ? `/api/similar-properties/${id}/${category}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    similarProperties: data as Property[] | undefined,
    isLoading,
    error,
  };
}

export function useNearbyProperties(id: string, city: string) {
  const { data, error, isLoading } = useSWR(
    id && city
      ? `/api/nearby-properties/${id}/${encodeURIComponent(city)}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    nearbyProperties: data as Property[] | undefined,
    isLoading,
    error,
  };
}

export function useFavoriteStatus(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/favorite-status/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    isFavorite: data as boolean | undefined,
    isLoading,
    error,
    mutate,
  };
}
