// Shared type definitions for the application

export interface Property {
  id: string;
  name: string;
  title?: string; // alias for name for backward compatibility
  description: string | null;
  price: number;
  location: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  purpose: "sale" | "rent";
  category: string; // Property category like "Land", "Commercial Property", "House", etc.
  propertyType: string; // Foreign key to property_types table (estate/development ID)
  propertyTypeName?: string; // Name of the property type/estate for display
  estate: string | null;
  status: "available" | "sold" | "reserved";
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: string | null;
  //   square_feet: number | null;
  //   squareFeet?: number; // alias for square_feet for backward compatibility
  lotSize?: number;
  yearBuilt?: number;
  garageSpaces?: number;
  amenities?: string[];
  floor_plan_url: string | null;
  created_at: string;
  updated_at: string;
  // Image related fields (populated from joins)
  primaryImage?: PropertyImage;
  images?: PropertyImage[];
  virtualTourEnabled?: boolean;
}

export interface PropertyType {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  isPrimary: boolean;
  category?:
    | "main"
    | "exterior"
    | "interior"
    | "kitchen"
    | "bathroom"
    | "bedroom"
    | "amenities"
    | "outdoor";
  sort_order?: number;
  created_at?: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: "admin" | "agent" | "client";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form interfaces for creating/editing
export interface PropertyFormData {
  name: string;
  description: string;
  price: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  purpose: "sale" | "rent";
  category: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  lot_size: string;
  year_built: string;
  garage_spaces: string;
  amenities: string[];
  status?: "available" | "sold" | "reserved";
}

export interface ImageFile {
  file: File;
  id: string;
  isPrimary: boolean;
  category:
    | "main"
    | "exterior"
    | "interior"
    | "kitchen"
    | "bathroom"
    | "bedroom"
    | "amenities"
    | "outdoor";
}

export interface FloorPlanFile {
  file: File;
  id: string;
  name: string;
}

// API response types
export interface PropertiesResponse {
  properties: Property[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
  } | null;
}

// Filter and search types
export interface PropertyFilters {
  searchQuery?: string;
  category?: string;
  propertyType?: string;
  purpose?: string;
  bedrooms?: string;
  priceRange?: [number, number];
  city?: string;
  status?: string;
}

export interface PropertySortOption {
  value: string;
  label: string;
}
