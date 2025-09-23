"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface FormData {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  lotSize: string;
  category: string;
  propertyType: string; // Add property type field
  purpose: string;
  yearBuilt: string;
  garageSpaces: string;
  amenities: string[];
  latitude: string;
  longitude: string;
  locationId: string;
  status?: string; // Only for editing
}

interface FloorPlanFile {
  file: File;
  id: string;
  name: string;
}

interface ImageFile {
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

interface ExistingImage {
  id: number;
  url: string;
  isPrimary: boolean;
  category?: string;
}

interface UnifiedListingFormProps {
  mode: "create" | "edit";
  listingId?: string;
  onBackPath: string;
}

const initialFormData: FormData = {
  title: "",
  description: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  lotSize: "",
  category: "",
  propertyType: "", // Add property type field
  purpose: "",
  yearBuilt: "",
  garageSpaces: "",
  amenities: [],
  latitude: "",
  longitude: "",
  locationId: "",
  status: "active",
};

const AVAILABLE_AMENITIES = [
  "Air Conditioning",
  "Swimming Pool",
  "Gym/Fitness Center",
  "Parking",
  "Balcony",
  "Garden",
  "Fireplace",
  "Walk-in Closet",
  "Laundry Room",
  "Dishwasher",
  "Hardwood Floors",
  "Updated Kitchen",
  "Master Suite",
  "Guest Room",
  "Home Office",
  "Security System",
  "Elevator",
  "Rooftop Access",
  "Pet Friendly",
  "Furnished",
  "Utilities Included",
  "High-Speed Internet",
  "Storage Unit",
  "Concierge",
];

export default function UnifiedListingForm({
  mode,
  listingId,
  onBackPath,
}: UnifiedListingFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    category: "",
    propertyType: "", // Add property type field
    status: "available",
    title: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    lotSize: "",
    purpose: "",
    yearBuilt: "",
    garageSpaces: "",
    latitude: "",
    longitude: "",
    locationId: "",
    amenities: [] as string[],
  });
  const [images, setImages] = useState<ImageFile[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [floorPlan, setFloorPlan] = useState<FloorPlanFile | null>(null);
  const [existingFloorPlan, setExistingFloorPlan] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Location management state
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string; country: string }>
  >([]);

  // Property types management state
  const [propertyTypes, setPropertyTypes] = useState<
    Array<{ id: string; name: string; description: string | null }>
  >([]);

  // Load locations and property types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from("locations")
          .select("id, name, country")
          .eq("is_active", true)
          .order("name");

        if (locationsError) throw locationsError;
        setLocations(locationsData || []);

        // Fetch property types
        const { data: propertyTypesData, error: propertyTypesError } =
          await supabase
            .from("property_types")
            .select("id, name, description")
            .eq("is_active", true)
            .order("name");

        if (propertyTypesError) throw propertyTypesError;
        setPropertyTypes(propertyTypesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Load existing listing data for edit mode
  useEffect(() => {
    if (mode === "edit" && listingId) {
      const fetchListing = async () => {
        try {
          const supabase = createClient();

          // Fetch property data
          const { data: property, error: propertyError } = await supabase
            .from("properties")
            .select("*")
            .eq("id", listingId)
            .single();

          if (propertyError) {
            throw new Error("Failed to fetch property data");
          }

          // Fetch property images
          const { data: images, error: imagesError } = await supabase
            .from("property_images")
            .select("*")
            .eq("property_id", listingId)
            .order("sort_order", { ascending: true });

          if (imagesError) {
            console.warn("Failed to fetch images:", imagesError);
          }

          // Populate form with existing data
          setFormData({
            name: property.title || property.name || "",
            description: property.description || "",
            price: property.price?.toString() || "",
            location: property.address || property.location || "",
            status: property.status || "available",
            title: property.title || property.name || "",
            address: property.address || property.location || "",
            city: property.city || "",
            state: property.state || "",
            zipCode: property.zipCode || "",
            bedrooms: property.bedrooms?.toString() || "",
            bathrooms: property.bathrooms?.toString() || "",
            sqft: property.squareFeet?.toString() || "",
            lotSize: property.lotSize?.toString() || "",
            category: property.category || "",
            propertyType: property.propertyType || "", // Add property type from existing data
            purpose: property.purpose || "",
            yearBuilt: property.yearBuilt?.toString() || "",
            garageSpaces: property.garageSpaces?.toString() || "",
            latitude: property.latitude?.toString() || "",
            longitude: property.longitude?.toString() || "",
            locationId: property.location_id || "",
            amenities: property.amenities ? JSON.parse(property.amenities) : [],
          });

          // Format images for existing images state
          const formattedImages = (images || []).map((img) => ({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary || false,
            category: img.category || "main",
          }));

          setExistingImages(formattedImages);

          // Set existing floor plan if available
          if (property.floor_plan_url) {
            setExistingFloorPlan(property.floor_plan_url);
          }
        } catch (error) {
          setError("Failed to load listing data");
          console.error("Error fetching listing:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchListing();
    }
  }, [mode, listingId]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user starts typing
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    const newImages: ImageFile[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      isPrimary: false,
      category: "main",
    }));

    setImages((prev) => {
      const updated = [...prev, ...newImages].slice(0, 10); // Max 10 images
      // Set first image as primary if none exists and no existing images
      if (
        updated.length > 0 &&
        existingImages.length === 0 &&
        !updated.some((img) => img.isPrimary)
      ) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const handleFloorPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Floor plan must be under 5MB",
          variant: "destructive",
        });
        return;
      }

      setFloorPlan({
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
      });
    }
  };

  const removeFloorPlan = () => {
    setFloorPlan(null);
  };

  const removeExistingFloorPlan = () => {
    setExistingFloorPlan(null);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // If we removed the primary image, make the first one primary
      if (
        filtered.length > 0 &&
        existingImages.length === 0 &&
        !filtered.some((img) => img.isPrimary)
      ) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
    // Also unset existing images as primary
    setExistingImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: false }))
    );
  };

  const setPrimaryExistingImage = (id: number) => {
    setExistingImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === id }))
    );
    // Also unset new images as primary
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: false })));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const setImageCategory = (id: string, category: ImageFile["category"]) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, category } : img))
    );
  };

  const removeExistingImage = (id: number) => {
    setImagesToDelete((prev) => [...prev, id]);
    setExistingImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // If we removed the primary image and there are other images, make first one primary
      const removedImage = prev.find((img) => img.id === id);
      if (removedImage?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      } else if (removedImage?.isPrimary && images.length > 0) {
        // Make first new image primary if no existing images left
        setImages((prevImages) =>
          prevImages.map((img, index) => ({ ...img, isPrimary: index === 0 }))
        );
      }
      return filtered;
    });
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Title is required";
    if (formData.title.length < 10)
      return "Title must be at least 10 characters";
    if (!formData.description.trim()) return "Description is required";
    if (formData.description.length < 50)
      return "Description must be at least 50 characters";
    if (!formData.address.trim()) return "Address is required";
    if (!formData.locationId.trim()) return "Location is required";
    if (!formData.state.trim()) return "State is required";
    if (!formData.zipCode.trim()) return "ZIP code is required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      return "Valid price is required";
    if (!formData.category) return "Property category is required";
    if (!formData.purpose) return "Purpose (sale/rent) is required";

    // GPS coordinates validation (optional but if provided, must be valid)
    if (
      formData.latitude &&
      (parseFloat(formData.latitude) < -90 ||
        parseFloat(formData.latitude) > 90)
    ) {
      return "Latitude must be between -90 and 90";
    }
    if (
      formData.longitude &&
      (parseFloat(formData.longitude) < -180 ||
        parseFloat(formData.longitude) > 180)
    ) {
      return "Longitude must be between -180 and 180";
    }

    // These fields are not required for land properties
    const isLandProperty = formData.category === "land";

    if (!isLandProperty) {
      if (!formData.bedrooms || parseInt(formData.bedrooms) < 0)
        return "Valid number of bedrooms is required";
      if (!formData.bathrooms || parseFloat(formData.bathrooms) < 0)
        return "Valid number of bathrooms is required";
      if (!formData.sqft || parseInt(formData.sqft) <= 0)
        return "Valid square footage is required";
    } else {
      // For land properties, lot size becomes required
      if (!formData.lotSize || parseInt(formData.lotSize) <= 0)
        return "Valid land size is required for land properties";

      // For land properties, validate these fields if they are provided
      if (formData.bedrooms && parseInt(formData.bedrooms) < 0)
        return "Valid number of bedrooms is required if provided";
      if (formData.bathrooms && parseFloat(formData.bathrooms) < 0)
        return "Valid number of bathrooms is required if provided";
      if (formData.sqft && parseInt(formData.sqft) <= 0)
        return "Valid square footage is required if provided";
    }

    if (mode === "create" && images.length === 0)
      return "At least one image is required";
    if (mode === "edit" && existingImages.length === 0 && images.length === 0)
      return "At least one image is required";

    return null;
  };

  const handleSubmitOld = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submitFormData = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "amenities") {
          submitFormData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          submitFormData.append(key, value as string);
        }
      });

      if (mode === "edit") {
        // Add edit-specific data
        submitFormData.append("imagesToDelete", JSON.stringify(imagesToDelete));
        submitFormData.append("existingImages", JSON.stringify(existingImages));
        submitFormData.append("newImageCount", images.length.toString());

        // Add new images
        images.forEach((imageItem, index) => {
          submitFormData.append(`new_image_${index}`, imageItem.file);
          submitFormData.append(
            `new_image_${index}_category`,
            imageItem.category
          );
          if (imageItem.isPrimary) {
            submitFormData.append("newPrimaryImageIndex", index.toString());
          }
        });
      } else {
        // Add create-specific data
        images.forEach((imageItem, index) => {
          submitFormData.append(`image_${index}`, imageItem.file);
          submitFormData.append(`image_${index}_category`, imageItem.category);
          if (imageItem.isPrimary) {
            submitFormData.append("primaryImageIndex", index.toString());
          }
        });
        submitFormData.append("imageCount", images.length.toString());
      }

      const url =
        mode === "edit" ? `/api/listings/${listingId}` : "/api/listings";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: submitFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${mode === "edit" ? "update" : "create"} listing`
        );
      }

      const result = await response.json();

      toast({
        title: mode === "edit" ? "Listing updated" : "Listing created",
        description: `"${formData.title}" has been ${
          mode === "edit" ? "updated" : "created"
        } successfully.`,
      });

      // Redirect to listings page
      router.push("/dashboard/admin/listings");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const supabase = await createClient();

    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Comprehensive validation similar to validateForm
      if (!formData.title?.trim() && !formData.name?.trim()) {
        throw new Error("Title is required");
      }

      const title = formData.title || formData.name;
      if (title && title.length < 10) {
        throw new Error("Title must be at least 10 characters");
      }

      if (!formData.description?.trim()) {
        throw new Error("Description is required");
      }

      if (formData.description.length < 50) {
        throw new Error("Description must be at least 50 characters");
      }

      if (!formData.address?.trim() && !formData.location?.trim()) {
        throw new Error("Address is required");
      }

      if (!formData.city?.trim()) {
        throw new Error("City is required");
      }

      if (!formData.state?.trim()) {
        throw new Error("State is required");
      }

      if (!formData.zipCode?.trim()) {
        throw new Error("ZIP code is required");
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error("Valid price is required");
      }

      // These fields are not required for land properties
      const category = formData.category || formData.category;
      const isLandProperty = category === "land";

      if (!isLandProperty) {
        if (!formData.bedrooms || parseInt(formData.bedrooms) < 0) {
          throw new Error("Valid number of bedrooms is required");
        }

        if (!formData.bathrooms || parseFloat(formData.bathrooms) < 0) {
          throw new Error("Valid number of bathrooms is required");
        }

        if (!formData.sqft || parseInt(formData.sqft) <= 0) {
          throw new Error("Valid square footage is required");
        }
      } else {
        // For land properties, lot size becomes required
        if (!formData.lotSize || parseInt(formData.lotSize) <= 0) {
          throw new Error("Valid land size is required for land properties");
        }

        // For land properties, validate these fields if they are provided
        if (formData.bedrooms && parseInt(formData.bedrooms) < 0) {
          throw new Error("Valid number of bedrooms is required if provided");
        }

        if (formData.bathrooms && parseFloat(formData.bathrooms) < 0) {
          throw new Error("Valid number of bathrooms is required if provided");
        }

        if (formData.sqft && parseInt(formData.sqft) <= 0) {
          throw new Error("Valid square footage is required if provided");
        }
      }

      if (!formData.category && !formData.category) {
        throw new Error("Property category is required");
      }

      if (!formData.propertyType) {
        throw new Error("Property type/estate is required");
      }

      if (!formData.purpose) {
        throw new Error("Purpose (sale/rent) is required");
      }

      if (mode === "create" && images.length === 0) {
        throw new Error("At least one image is required");
      }

      if (
        mode === "edit" &&
        existingImages.length === 0 &&
        images.length === 0
      ) {
        throw new Error("At least one image is required");
      }

      let propertyId = listingId;

      // Process and prepare data for database
      const propertyData = {
        name: formData.title || formData.name,
        title: formData.title || formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        location: formData.address || formData.location,
        address: formData.address || formData.location,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        category: formData.category || formData.category,
        propertyType: formData.propertyType, // Add property type
        purpose: formData.purpose,
        status: formData.status || "available",
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        // sqft: formData.sqft ? parseInt(formData.sqft) : null,
        squareFeet: formData.sqft ? parseInt(formData.sqft) : null,
        lotSize: formData.lotSize ? parseFloat(formData.lotSize) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        garageSpaces: formData.garageSpaces
          ? parseInt(formData.garageSpaces)
          : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        location_id: formData.locationId || null,
        amenities: JSON.stringify(formData.amenities || []),
        floor_plan_url: null, // Will be updated after floor plan upload
      };

      // Handle property creation/update
      if (mode === "edit" && listingId) {
        // Update existing property
        const { error } = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", listingId);

        if (error) throw error;
      } else {
        // Create new property
        const { data: newProperty, error } = await supabase
          .from("properties")
          .insert([propertyData])
          .select("id")
          .single();

        if (error) throw error;
        propertyId = newProperty.id;
      }

      // Handle image uploads and deletions
      if (mode === "edit") {
        // Delete removed images from storage and database
        if (imagesToDelete.length > 0) {
          // Get image paths to delete from storage
          const { data: imagesToDeleteData } = await supabase
            .from("property_images")
            .select("url")
            .in("id", imagesToDelete);

          if (imagesToDeleteData) {
            // Delete from storage
            const imagePaths = imagesToDeleteData.map((img) => {
              const url = new URL(img.url);
              return url.pathname.replace(
                "/storage/v1/object/public/property-images/",
                ""
              );
            });

            if (imagePaths.length > 0) {
              await supabase.storage.from("property-images").remove(imagePaths);
            }
          }

          // Delete from database
          await supabase
            .from("property_images")
            .delete()
            .in("id", imagesToDelete);
        }

        // Update existing images primary status
        for (const existingImage of existingImages) {
          await supabase
            .from("property_images")
            .update({ isPrimary: existingImage.isPrimary })
            .eq("id", existingImage.id);
        }
      }

      // Upload new images
      const uploadedImages = [];
      for (const [index, imageItem] of images.entries()) {
        const fileExt = imageItem.file.name.split(".").pop();
        const fileName = `${propertyId}/${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, imageItem.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);

        // Save image record to database
        const { error: imageError } = await supabase
          .from("property_images")
          .insert([
            {
              property_id: propertyId,
              url: publicUrlData.publicUrl,
              isPrimary: imageItem.isPrimary,
              category: imageItem.category,
              sort_order: index,
            },
          ]);

        if (imageError) throw imageError;

        uploadedImages.push({
          url: publicUrlData.publicUrl,
          category: imageItem.category,
          isPrimary: imageItem.isPrimary,
        });
      }

      // Handle floor plan upload
      let floorPlanUrl = existingFloorPlan;

      // If existing floor plan was removed
      if (mode === "edit" && existingFloorPlan && !floorPlan) {
        floorPlanUrl = null;
      }

      // If new floor plan was uploaded
      if (floorPlan) {
        const fileExt = floorPlan.file.name.split(".").pop();
        const fileName = `${propertyId}/floor-plan-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, floorPlan.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);

        floorPlanUrl = publicUrlData.publicUrl;
      }

      // Update property with floor plan URL
      if (floorPlanUrl !== existingFloorPlan) {
        const { error: floorPlanError } = await supabase
          .from("properties")
          .update({ floor_plan_url: floorPlanUrl })
          .eq("id", propertyId);

        if (floorPlanError) throw floorPlanError;
      }

      toast({
        title: mode === "edit" ? "Property updated" : "Property created",
        description: `"${propertyData.name}" has been ${
          mode === "edit" ? "updated" : "created"
        } successfully.`,
      });

      router.push("/dashboard/admin/listings");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading listing...</span>
        </div>
      </div>
    );
  }

  const totalImages = existingImages.length + images.length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={onBackPath}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {mode === "edit" ? "Edit Listing" : "Add New Listing"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Essential details about your property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Beautiful 3BR Family Home in Downtown"
                maxLength={100}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your property, its features, and what makes it special..."
                className="min-h-[120px]"
                maxLength={2000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Property Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type / Estate *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) =>
                    handleInputChange("propertyType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type/estate" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((propertyType) => (
                      <SelectItem key={propertyType.id} value={propertyType.id}>
                        {propertyType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the estate or development where this property is
                  located.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purpose">Purpose *</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => handleInputChange("purpose", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="For sale or rent?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "edit" && (
              <div>
                <Label htmlFor="status">Listing Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Where is your property located?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => {
                    handleInputChange("locationId", value);
                    // Auto-populate city from selected location
                    const selectedLocation = locations.find(
                      (loc) => loc.id === value
                    );
                    if (selectedLocation) {
                      handleInputChange("city", selectedLocation.name);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}, {location.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Don't see your location? Contact admin to add it.
                </p>
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="State"
                />
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>

            {/* GPS Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude (GPS)</Label>
                <Input
                  id="latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={(e) =>
                    handleInputChange("latitude", e.target.value)
                  }
                  placeholder="e.g., 9.0765"
                  step="any"
                  min="-90"
                  max="90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional GPS coordinate for precise location
                </p>
              </div>

              <div>
                <Label htmlFor="longitude">Longitude (GPS)</Label>
                <Input
                  id="longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={(e) =>
                    handleInputChange("longitude", e.target.value)
                  }
                  placeholder="e.g., 7.3986"
                  step="any"
                  min="-180"
                  max="180"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              Specific details about the property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="price">
                Price * ({formData.purpose === "rent" ? "per month" : "total"})
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            {formData.category !== "land" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) =>
                      handleInputChange("bedrooms", e.target.value)
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) =>
                      handleInputChange("bathrooms", e.target.value)
                    }
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>

                <div>
                  <Label htmlFor="sqft">Square Feet *</Label>
                  <Input
                    id="sqft"
                    type="number"
                    value={formData.sqft}
                    onChange={(e) => handleInputChange("sqft", e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) =>
                      handleInputChange("yearBuilt", e.target.value)
                    }
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            )}

            {formData.category === "land" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearBuilt">Year Built (optional)</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) =>
                      handleInputChange("yearBuilt", e.target.value)
                    }
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lotSize">
                  {formData.category === "land"
                    ? "Land Size (sqm) *"
                    : "Lot Size (sqm)"}
                </Label>
                <Input
                  id="lotSize"
                  type="number"
                  value={formData.lotSize}
                  onChange={(e) => handleInputChange("lotSize", e.target.value)}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Size in square meters (sqm)
                </p>
              </div>

              {formData.category !== "land" && (
                <div>
                  <Label htmlFor="garageSpaces">Garage Spaces (optional)</Label>
                  <Input
                    id="garageSpaces"
                    type="number"
                    value={formData.garageSpaces}
                    onChange={(e) =>
                      handleInputChange("garageSpaces", e.target.value)
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Property Amenities</CardTitle>
            <CardDescription>
              Select all amenities that apply to your property
              {formData.category === "land" &&
                " (showing land-relevant amenities only)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {AVAILABLE_AMENITIES.filter((amenity) => {
                // Filter out amenities that don't make sense for land properties
                if (formData.category === "land") {
                  const landRelevantAmenities = [
                    "Swimming Pool",
                    "Parking",
                    "Garden",
                    "Security System",
                    "Utilities Included",
                    "High-Speed Internet",
                    "Storage Unit",
                  ];
                  return landRelevantAmenities.includes(amenity);
                }
                return true;
              }).map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <Label htmlFor={amenity} className="text-sm">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Property Images</CardTitle>
            <CardDescription>
              Upload photos of your property (max 10 images total, 5MB each)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Images (Edit Mode) */}
            {mode === "edit" && existingImages.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Current Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {existingImages.map((imageItem) => (
                    <div
                      key={imageItem.id}
                      className={`relative border-2 rounded-lg overflow-hidden ${
                        imageItem.isPrimary
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={imageItem.url}
                        alt="Existing property image"
                        className="w-full h-32 object-cover"
                      />

                      {imageItem.isPrimary && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}

                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">
                            Actions:
                          </Label>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPrimaryExistingImage(imageItem.id)
                              }
                              className={`p-1 rounded text-white hover:bg-yellow-500 ${
                                imageItem.isPrimary
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                              }`}
                              title="Set as primary image"
                            >
                              <Star className="h-3 w-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeExistingImage(imageItem.id)}
                              className="p-1 bg-red-400 text-white rounded hover:bg-red-500"
                              title="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            {totalImages < 10 && (
              <div>
                <Label htmlFor="images">
                  {mode === "edit" ? "Add More Images" : "Upload Images *"}
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP up to 5MB each ({totalImages}/10 images)
                    </p>
                  </div>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById("images")?.click()}
                  >
                    Select Images
                  </Button>
                </div>
              </div>
            )}

            {/* New Images Preview */}
            {images.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {mode === "edit" ? "New Images" : "Uploaded Images"} (
                    {images.length})
                  </h4>
                  <p className="text-xs text-gray-500">
                    Click star to set primary, use arrows to reorder
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((imageItem, index) => (
                    <div
                      key={imageItem.id}
                      className={`relative border-2 rounded-lg overflow-hidden ${
                        imageItem.isPrimary
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={URL.createObjectURL(imageItem.file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />

                      {imageItem.isPrimary && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}

                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded capitalize">
                        {imageItem.category}
                      </div>

                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">
                            Category:
                          </Label>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(imageItem.id)}
                              className={`p-1 rounded text-white hover:bg-yellow-500 ${
                                imageItem.isPrimary
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                              }`}
                              title="Set as primary image"
                            >
                              <Star className="h-3 w-3" />
                            </button>

                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(index, index - 1)}
                                className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                                title="Move left"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                            )}

                            {index < images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(index, index + 1)}
                                className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                                title="Move right"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeImage(imageItem.id)}
                              className="p-1 bg-red-400 text-white rounded hover:bg-red-500"
                              title="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <Select
                          value={imageItem.category}
                          onValueChange={(value: ImageFile["category"]) =>
                            setImageCategory(imageItem.id, value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main">Main</SelectItem>
                            <SelectItem value="exterior">Exterior</SelectItem>
                            <SelectItem value="interior">Interior</SelectItem>
                            <SelectItem value="kitchen">Kitchen</SelectItem>
                            <SelectItem value="bathroom">Bathroom</SelectItem>
                            <SelectItem value="bedroom">Bedroom</SelectItem>
                            <SelectItem value="amenities">Amenities</SelectItem>
                            <SelectItem value="outdoor">Outdoor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floor Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Floor Plan</CardTitle>
            <CardDescription>
              Upload a floor plan image for your property (optional, max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Floor Plan (Edit Mode) */}
            {mode === "edit" && existingFloorPlan && (
              <div className="space-y-4">
                <h4 className="font-medium">Current Floor Plan</h4>
                <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden max-w-md">
                  <img
                    src={existingFloorPlan}
                    alt="Current floor plan"
                    className="w-full h-64 object-contain bg-gray-50"
                  />
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={removeExistingFloorPlan}
                      className="w-full p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                    >
                      Remove Current Floor Plan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload New Floor Plan */}
            {!floorPlan && !existingFloorPlan && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    Upload Floor Plan
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFloorPlanUpload}
                  className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}

            {/* New Floor Plan Preview */}
            {floorPlan && (
              <div className="space-y-4">
                <h4 className="font-medium">
                  {mode === "edit" ? "New Floor Plan" : "Floor Plan Preview"}
                </h4>
                <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden max-w-md">
                  <img
                    src={URL.createObjectURL(floorPlan.file)}
                    alt="Floor plan preview"
                    className="w-full h-64 object-contain bg-gray-50"
                  />
                  <div className="p-3 space-y-2">
                    <p className="text-sm text-gray-600 truncate">
                      {floorPlan.name}
                    </p>
                    <button
                      type="button"
                      onClick={removeFloorPlan}
                      className="w-full p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                    >
                      Remove Floor Plan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Replace Floor Plan (Edit Mode with existing) */}
            {mode === "edit" && existingFloorPlan && !floorPlan && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Upload a new floor plan to replace the current one
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFloorPlanUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link href={onBackPath}>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting
              ? `${mode === "edit" ? "Updating" : "Creating"} Listing...`
              : `${mode === "edit" ? "Update" : "Create"} Listing`}
          </Button>
        </div>
      </form>
    </div>
  );
}
