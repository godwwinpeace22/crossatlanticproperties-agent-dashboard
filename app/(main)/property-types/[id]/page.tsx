"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Property, PropertyType, PropertyImage } from "@/lib/types";

export default function PropertyTypePage() {
  const params = useParams();
  const propertyTypeId = params.id as string;

  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyImages, setPropertyImages] = useState<
    Record<string, PropertyImage>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyTypeId) {
      fetchData();
    }
  }, [propertyTypeId]);

  const fetchData = async () => {
    try {
      const supabase = createClient();

      // Fetch property type info
      const { data: propertyTypeData, error: propertyTypeError } =
        await supabase
          .from("property_types")
          .select("*")
          .eq("id", propertyTypeId)
          .single();

      if (propertyTypeError) throw propertyTypeError;
      setPropertyType(propertyTypeData);

      // Fetch properties of this type
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select()
        .eq("propertyType", propertyTypeId)
        .order("created_at", { ascending: false });

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch primary images for each property
      if (propertiesData && propertiesData.length > 0) {
        const propertyIds = propertiesData.map((p) => p.id);
        const { data: imagesData, error: imagesError } = await supabase
          .from("property_images")
          .select("*")
          .in("property_id", propertyIds)
          .eq("isPrimary", true);

        if (!imagesError && imagesData) {
          const imagesMap = imagesData.reduce((acc, img) => {
            acc[img.property_id] = img;
            return acc;
          }, {} as Record<string, PropertyImage>);
          setPropertyImages(imagesMap);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load property type data");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, purpose: string) => {
    const formattedPrice = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

    // if (purpose === "sale") {
    //   return formattedPrice;
    // }

    // if (purpose === "rent") {
    //   return `${formattedPrice}/month`;
    // }
    return formattedPrice;
  };

  const formatSize = (size: number | null) => {
    if (!size) return "N/A";
    return `${size.toLocaleString()} sqft`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded w-96 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/property-types">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!propertyType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Property Type Not Found
          </h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-6">
          <Link
            href="/property-types"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-start gap-6">
            {propertyType.image_url && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={propertyType.image_url}
                  alt={propertyType.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {propertyType.name}
              </h1>
              {propertyType.description && (
                <p className="text-lg text-gray-600 max-w-2xl">
                  {propertyType.description}
                </p>
              )}
              <div className="mt-4">
                <Badge variant="secondary">
                  {properties.length}{" "}
                  {properties.length === 1 ? "Property" : "Properties"}{" "}
                  Available
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="container-custom py-8">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No properties available
            </h3>
            <p className="text-gray-600">
              There are currently no properties of this type available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  {/* Property Image */}
                  <div className="relative h-48 bg-gray-100">
                    {propertyImages[property.id] ? (
                      <Image
                        src={propertyImages[property.id].url}
                        alt={property.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant={
                          property.status === "available"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {property.status === "available"
                          ? "Available"
                          : property.status === "sold"
                          ? "Sold"
                          : property.status === "reserved"
                          ? "Reserved"
                          : typeof property.status === "string"
                          ? (property.status as string)
                              .charAt(0)
                              .toUpperCase() +
                            (property.status as string).slice(1)
                          : "Unknown"}
                      </Badge>
                    </div>

                    {/* Purpose Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="text-xs bg-white/90">
                        {property.purpose === "sale" ? "For Sale" : "For Rent"}
                      </Badge>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {property.name}
                    </h3>

                    {/* Size and Price */}
                    <div className="flex">
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="text-lg font-medium">
                            {formatSize(property.lotSize || null)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-1">
                        <div className="text-xl font-bold text-blue-600">
                          {formatPrice(property.price, property.purpose)}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    {/* <div className="flex items-center gap-1 text-gray-600 mb-3">
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm line-clamp-1">
                        {property.address}, {property.city}
                      </span>
                    </div> */}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
