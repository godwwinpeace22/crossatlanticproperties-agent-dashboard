-- Rename property_type column to category
-- This migration updates the existing property_type field to be called category

-- Rename the column
alter table public.properties rename column property_type to category;

-- Update any indexes or constraints if they exist
-- (The column rename should automatically handle most references)

-- Comment explaining the change:
-- The property_type field has been renamed to category for better clarity
-- This field stores property categories like "Land", "Commercial Property", "House", "Apartment", etc.