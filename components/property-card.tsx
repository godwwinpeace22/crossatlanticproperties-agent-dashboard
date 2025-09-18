"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Bed, Bath, Maximize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/lib/types";

interface PropertyCardProps {
  property: Property;
  viewMode: "grid" | "list";
}

const getCategoryDisplay = (status: string) => {
  return status === "available" ? "Available" : "Sold";
};

const formatPrice = (price: number, purpose?: string) => {
  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(price);

  if (purpose === "rent") {
    return `${formattedPrice}/month`;
  }
  return formattedPrice;
};

export function PropertyCard({ property, viewMode }: PropertyCardProps) {
  const isListView = viewMode === "list";

  return (
    <div
      className={`property-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 ${
        isListView ? "flex" : ""
      }`}
    >
      <div
        className={`relative ${
          isListView ? "w-80 h-60 flex-shrink-0" : "h-64"
        } overflow-hidden`}
      >
        <Image
          src={
            property.primaryImage?.url ||
            property.images?.[0]?.url ||
            "/placeholder.svg"
          }
          alt={property.title || property.name || "Property"}
          fill
          className="object-cover property-image"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="flex space-x-2">
              {/* Favorites button can be added here */}
            </div>
          </div>
        </div>

        {/* Property Type Badge */}
        <div className="absolute top-4 left-4">
          <Badge
            className={
              property.status === "available"
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-orange-500 hover:bg-orange-600"
            }
          >
            {getCategoryDisplay(property.status)}
          </Badge>
        </div>

        {/* Property Category Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-800">
            {property.category?.charAt(0)?.toUpperCase() +
              property.category?.slice(1)}
          </Badge>
        </div>
      </div>

      <div className={`p-6 ${isListView ? "flex-1" : ""}`}>
        <div className="mb-3">
          <Link href={`/properties/${property.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
              {property.title}
            </h3>
          </Link>
          <div className="text-xl font-bold text-blue-600">
            {formatPrice(property.price, property.purpose)}
          </div>
        </div>

        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="h-4 w-4 mr-1 text-orange-500" />
          <span className="text-sm">
            {property.city}, {property.state}
          </span>
        </div>

        {/* Property Details - Inline */}
        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600">
          {property.bedrooms && property.category !== "land" && (
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>
                {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {property.bathrooms && property.category !== "land" && (
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>
                {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {property.category === "land" && (
            <div className="flex items-center">
              <Maximize className="h-4 w-4 mr-1" />
              <span>{property?.lotSize} sq ft</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="property-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-64 bg-gray-200 relative">
        {/* Badge skeletons */}
        <div className="absolute top-4 left-4 h-6 w-16 bg-gray-300 rounded"></div>
        <div className="absolute top-4 right-4 h-6 w-20 bg-gray-300 rounded"></div>
      </div>

      <div className="p-6">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>

        {/* Price skeleton */}
        <div className="h-7 bg-gray-300 rounded w-32 mb-3"></div>

        {/* Location skeleton */}
        <div className="flex items-center mb-4">
          <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
          <div className="h-4 bg-gray-200 rounded w-28"></div>
        </div>

        {/* Property details skeleton */}
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-200 rounded mr-1"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-200 rounded mr-1"></div>
            <div className="h-4 bg-gray-200 rounded w-14"></div>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-200 rounded mr-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
