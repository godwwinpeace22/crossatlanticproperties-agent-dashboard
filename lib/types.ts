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

  lotSize?: number;
  yearBuilt?: number;
  garageSpaces?: number;
  amenities?: string[];
  floor_plan_url: string | null;

  // Promotional pricing fields
  original_price?: number;
  promotional_price?: number;
  promotion_start_date?: string;
  promotion_end_date?: string;
  is_promotional?: boolean;
  allowed_payment_plans?: string[];

  // Additional geographic fields
  latitude?: number;
  longitude?: number;

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
  role: "admin" | "agent";
  is_active: boolean;
  referral_id?: string | null; // Unique 8-character referral code
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

// Blog-related types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[] | null;
  status: "draft" | "published";
  featured: boolean;
  views: number;
  author_id: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFilters {
  category?: string;
  status?: string;
  search?: string;
  featured?: boolean;
}

export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  image_url: string;
  featured: boolean;
  status: "draft" | "published";
}

export interface BlogStats {
  total: number;
  published: number;
  drafts: number;
  totalViews: number;
}

// Payment Plan Types
export type PaymentPlan = "full" | "30-30-40" | "25x4";

export interface PaymentPlanOption {
  id: PaymentPlan;
  name: string;
  description: string;
  installments: number;
  percentages: number[];
}

// KYC Types
export type BuyerType = "individual" | "company";
export type KYCStatus = "pending" | "approved" | "rejected" | "needs_revision";

export interface KYCSubmission {
  id: string;
  user_id: string;
  buyer_type: BuyerType;

  // Personal/Company Information
  full_name?: string;
  company_name?: string;
  date_of_birth?: string;
  incorporation_date?: string;
  nationality?: string;
  country_of_incorporation?: string;
  address: string;
  phone_number: string;
  email_address: string;
  occupation?: string;
  nature_of_business?: string;
  annual_income?: number;
  investment_source?: string;

  // Document URLs
  government_id_url?: string;
  proof_of_address_url?: string;
  business_documents_urls?: string[];

  // KYC Status
  status: KYCStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;

  // Application Fee
  application_fee_paid: boolean;
  application_fee_amount: number;
  application_fee_payment_proof?: string;
  application_fee_approved: boolean;

  created_at: string;
  updated_at: string;
}

export interface KYCFormData {
  buyer_type: BuyerType;
  full_name?: string;
  company_name?: string;
  date_of_birth?: string;
  incorporation_date?: string;
  nationality?: string;
  country_of_incorporation?: string;
  address: string;
  phone_number: string;
  email_address: string;
  occupation?: string;
  nature_of_business?: string;
  annual_income?: string;
  investment_source?: string;

  // Files (handled separately)
  government_id_file?: File;
  proof_of_address_file?: File;
  business_documents_files?: File[];
  application_fee_payment_proof_file?: File;
}

// Interest Payment Types (Application Fee)
export type InterestPaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "abandoned";

export interface InterestPayment {
  id: string;
  property_interest_id?: string;
  user_id: string;
  property_id: string;
  amount: number;
  currency: string;
  payment_reference: string;
  payment_status: InterestPaymentStatus;
  payment_plan?: PaymentPlan;
  paystack_response?: any;
  paid_at?: string;
  created_at: string;
  updated_at: string;

  // Populated from joins
  property?: Property;
  user?: Profile;
  property_interest?: PropertyInterest;
}

// Property Interest Types
export type PropertyInterestStatus =
  | "payment_pending"
  | "payment_failed"
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "completed";

export interface PropertyInterest {
  id: string;
  user_id: string;
  property_id: string;
  kyc_submission_id?: string;
  interest_payment_id?: string;

  status: PropertyInterestStatus;
  selected_payment_plan: PaymentPlan;
  payment_timeframe?: number; // in months

  referral_code?: string;
  referring_agent_id?: string;

  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;

  created_at: string;
  updated_at: string;

  // Populated from joins
  property?: Property;
  user?: Profile;
  kyc_submission?: KYCSubmission;
  referring_agent?: Profile;
  installment_payments?: InstallmentPayment[];
  interest_payment?: InterestPayment;
}

// Installment Payment Types
export type InstallmentStatus = "pending" | "paid" | "overdue" | "waived";

export interface InstallmentPayment {
  id: string;
  property_interest_id: string;

  installment_number: number;
  amount: number;
  due_date: string;

  status: InstallmentStatus;
  paid_amount: number;
  payment_date?: string;
  payment_method?: string;
  transaction_reference?: string;
  payment_proof_url?: string;

  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;

  created_at: string;
  updated_at: string;

  // Populated from joins
  property_interest?: PropertyInterest;
}

// Notification Types
export type NotificationType =
  | "kyc_status"
  | "payment_reminder"
  | "interest_approved"
  | "interest_rejected"
  | "payment_confirmed"
  | "general";

export interface Notification {
  id: string;
  user_id: string;

  type: NotificationType;
  title: string;
  message: string;

  property_interest_id?: string;
  kyc_submission_id?: string;
  installment_payment_id?: string;

  read: boolean;
  read_at?: string;

  email_sent: boolean;
  email_sent_at?: string;
  email_error?: string;

  created_at: string;
  updated_at: string;

  // Populated from joins
  property_interest?: PropertyInterest;
  kyc_submission?: KYCSubmission;
  installment_payment?: InstallmentPayment;
}

// Dashboard Types
export interface UserDashboardData {
  property_interests: PropertyInterest[];
  kyc_submissions: KYCSubmission[];
  installment_payments: InstallmentPayment[];
  notifications: Notification[];
  stats: {
    total_interests: number;
    approved_interests: number;
    pending_payments: number;
    overdue_payments: number;
  };
}

export interface AdminDashboardData {
  pending_kyc_submissions: KYCSubmission[];
  pending_interests: PropertyInterest[];
  overdue_payments: InstallmentPayment[];
  recent_notifications: Notification[];
  stats: {
    total_users: number;
    pending_kyc: number;
    pending_interests: number;
    overdue_payments: number;
    total_revenue: number;
  };
}
