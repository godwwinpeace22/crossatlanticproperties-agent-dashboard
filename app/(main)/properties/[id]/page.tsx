"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bath,
  Bed,
  Calendar,
  ChevronLeft,
  Eye,
  Heart,
  Home,
  MapPin,
  Maximize,
  Share2,
  Loader2,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import PropertyGallery from "@/components/property-gallery";
import { PropertyDetailSkeleton } from "@/components/property-detail-skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  useProperty,
  usePropertyImages,
  useSimilarProperties,
  useNearbyProperties,
  useFavoriteStatus,
} from "@/hooks/use-property-data";
// import { InterestButton } from "@/components/interest-button";
// import { FavoritesButton } from "@/components/favorites-button";
// import { ContactSellerButton } from "@/components/contact-seller-button";

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

export default function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const propertyId = params.id;
  const { toast } = useToast();

  // SWR hooks for data fetching
  const {
    property,
    isLoading: isLoadingProperty,
    error: propertyError,
  } = useProperty(propertyId);
  const { images: propertyImages, isLoading: isLoadingImages } =
    usePropertyImages(propertyId);
  const { similarProperties, isLoading: isLoadingSimilar } =
    useSimilarProperties(propertyId, property?.category || "");
  const { nearbyProperties, isLoading: isLoadingNearby } = useNearbyProperties(
    propertyId,
    property?.city || ""
  );
  const { isFavorite, mutate: mutateFavorite } = useFavoriteStatus(propertyId);

  // Form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "I'm interested in this property...",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state
  const isLoading = isLoadingProperty || isLoadingImages;
  const isError = propertyError;

  // Helper functions to format data
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  const formatSquareFeet = (sqft: number) => {
    return new Intl.NumberFormat("en-US").format(sqft) + " sq ft";
  };

  const getCategoryDisplay = (status: string) => {
    return status === "available"
      ? "For Sale"
      : status === "sold"
      ? "Sold"
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get primary image or first image
  const getPrimaryImage = (images: PropertyImage[]) => {
    const primary = images?.find((img) => img.isPrimary);
    return primary?.url || images?.[0]?.url || "/placeholder.svg";
  };

  // Get all image URLs for gallery
  const getAllImageUrls = (images: PropertyImage[]) => {
    return images?.map((img) => img.url) || [];
  };

  // Handler functions for user interactions
  const handleContactProperty = () => {
    // Scroll to the contact form
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
      contactForm.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleToggleFavorite = async () => {
    if (!property) return;

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save properties to favorites.",
          variant: "destructive",
        });
        return;
      }

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("property_id", property.id)
          .eq("user_id", user.id);

        if (!error) {
          mutateFavorite(false, false);
          toast({
            title: "Removed from favorites",
            description: "Property removed from your favorites list.",
          });
        }
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert({
          property_id: property.id,
          user_id: user.id,
        });

        if (!error) {
          mutateFavorite(true, false);
          toast({
            title: "Added to favorites",
            description: "Property saved to your favorites list.",
          });
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareProperty = async () => {
    if (!property) return;

    const shareData = {
      title: property.title,
      text: `Check out this amazing property: ${property.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        // Use native share API if available
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Property link copied to clipboard!",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Final fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Property link copied to clipboard!",
        });
      } catch (clipboardError) {
        console.error("Clipboard access failed:", clipboardError);
        toast({
          title: "Error",
          description: "Failed to share property. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Save inquiry to database
      const { error } = await supabase.from("property_inquiries").insert({
        property_id: property.id,
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        message: contactForm.message,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Reset form
      setContactForm({
        name: "",
        email: "",
        phone: "",
        message: "I'm interested in this property...",
      });

      toast({
        title: "Inquiry sent successfully!",
        description: "We will contact you soon regarding this property.",
      });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormInputChange = (field: string, value: string) => {
    setContactForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <PropertyDetailSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !property) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <div className="container-custom py-8">
            <Button variant="ghost" size="sm" asChild className="mb-6">
              <Link href="/properties" className="flex items-center">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Link>
            </Button>
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <p className="text-red-600 mb-4">
                  Property not found or failed to load
                </p>
                <Button asChild>
                  <Link href="/properties">Browse All Properties</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="container-custom py-8">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/properties" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Link>
          </Button>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <PropertyGallery
                  images={getAllImageUrls(propertyImages || [])}
                />
                <div className="space-y-2">
                  <div className="">
                    <h1 className="text-3xl text-gray-600 font-bold">
                      {property.title}{" "}
                    </h1>
                    <Badge>{getCategoryDisplay(property.status)}</Badge>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>
                      {property.city}, {property.state}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  {property.category !== "land" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-primary" />
                        <div>
                          <span className="text-xs text-muted-foreground block">
                            Bedrooms
                          </span>
                          <span className="font-medium text-sm">
                            {property.bedrooms || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath className="h-4 w-4 text-primary" />
                        <div>
                          <span className="text-xs text-muted-foreground block">
                            Bathrooms
                          </span>
                          <span className="font-medium text-sm">
                            {property.bathrooms || 0}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Area
                      </span>
                      <span className="font-medium text-sm">
                        {formatSquareFeet(property.square_feet || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Property Details Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {property.description}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Property Details</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">
                          Property Type
                        </span>
                        <span className="font-medium">
                          {property.category.charAt(0).toUpperCase() +
                            property.category.slice(1)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">
                          Property Status
                        </span>
                        <span className="font-medium">
                          {getCategoryDisplay(property.status)}
                        </span>
                      </li>
                      {property.category !== "land" && (
                        <>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">
                              Bedrooms
                            </span>
                            <span className="font-medium">
                              {property.bedrooms || 0}
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">
                              Bathrooms
                            </span>
                            <span className="font-medium">
                              {property.bathrooms || 0}
                            </span>
                          </li>
                        </>
                      )}
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">
                          Square Feet
                        </span>
                        <span className="font-medium">
                          {formatSquareFeet(property.square_feet || 0)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Lot Size</span>
                        <span className="font-medium">
                          {property.lot_size
                            ? `${property.lot_size} sq ft`
                            : "N/A"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Separator />

                {/* Property Features Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">
                    Property Features
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    <div className="flex items-center">
                      <Home className="h-4 w-4 text-primary mr-2" />
                      <span>
                        {property.category.charAt(0).toUpperCase() +
                          property.category.slice(1)}
                      </span>
                    </div>
                    {property.category !== "land" && (
                      <>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 text-primary mr-2" />
                          <span>{property.bedrooms || 0} Bedrooms</span>
                        </div>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 text-primary mr-2" />
                          <span>{property.bathrooms || 0} Bathrooms</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center">
                      <Home className="h-4 w-4 text-primary mr-2" />
                      <span>{formatSquareFeet(property.square_feet || 0)}</span>
                    </div>
                    {property.lot_size && (
                      <div className="flex items-center">
                        <Home className="h-4 w-4 text-primary mr-2" />
                        <span>{property.lot_size} sq ft lot</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Floor Plan Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Floor Plan</h3>
                  {property.floor_plan_url ? (
                    <div className="w-full">
                      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <Image
                          src={property.floor_plan_url}
                          alt="Property floor plan"
                          width={800}
                          height={600}
                          className="w-full h-auto max-h-[600px] object-contain"
                          priority={false}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        Click image to view full size
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-400 mb-2">
                        <Home className="h-12 w-12 mx-auto mb-4" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No Floor Plan Available
                      </h4>
                      <p className="text-gray-600">
                        The floor plan for this property has not been uploaded
                        yet.
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Map Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Location</h3>
                    <p className="text-muted-foreground">{property.address}</p>
                    <p className="text-muted-foreground mt-1">
                      {property.city}, {property.state} {property.zip_code}
                    </p>
                  </div>

                  {property.latitude && property.longitude ? (
                    <div className="aspect-video overflow-hidden rounded-lg border">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/view?key=${
                          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
                          "YOUR_API_KEY"
                        }&center=${property.latitude},${
                          property.longitude
                        }&zoom=15&maptype=roadmap`}
                        title="Property Location Map"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video overflow-hidden rounded-lg border">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/search?key=${
                          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
                          "YOUR_API_KEY"
                        }&q=${encodeURIComponent(
                          property.address +
                            ", " +
                            property.city +
                            ", " +
                            property.state
                        )}&zoom=15`}
                        title="Property Location Map"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>Interactive map showing property location</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const mapUrl =
                          property.latitude && property.longitude
                            ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                property.address +
                                  ", " +
                                  property.city +
                                  ", " +
                                  property.state
                              )}`;
                        window.open(mapUrl, "_blank");
                      }}
                    >
                      Open in Google Maps
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Price Card */}
              <div className="rounded-lg border border-gray-200 p-6 bg-white">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-primary">
                    {formatPrice(property.price)}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {property.category === "land" ? "Per plot" : "Total price"}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full bg-blue-500 hover:bg-blue-500/90 cursor-pointer"
                    size="lg"
                    onClick={handleContactProperty}
                  >
                    Contact About This Property
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-lg border border-gray-200 p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleToggleFavorite}
                  >
                    <Heart
                      className={`mr-2 h-4 w-4 ${
                        isFavorite ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    {isFavorite ? "Remove from Favorites" : "Save to Favorites"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleShareProperty}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Property
                  </Button>
                </div>
              </div>

              {/* Call to Inquire */}
              <div className="rounded-lg border border-gray-200 p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4">Call to Inquire</h3>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Have questions? Call us directly for immediate assistance.
                  </p>
                  {/* Nigerian Line */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-semibold text-blue-900">
                          +234 708 611 2909
                        </p>
                        <p className="text-sm text-blue-700">
                          Nigeria • Mon-Fri 9AM-6PM WAT
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-100"
                      onClick={() => window.open("tel:+2347086112909", "_self")}
                    >
                      Call Now
                    </Button>
                  </div>
                  {/* UK Line */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-semibold text-green-900">
                          +44 743 546 8699
                        </p>
                        <p className="text-sm text-green-700">
                          UK • Mon-Fri 9AM-5PM GMT
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-200 text-green-700 hover:bg-green-100"
                      onClick={() => window.open("tel:+447435468699", "_self")}
                    >
                      Call Now
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div
                id="contact-form"
                className="rounded-lg border border-gray-200 p-6 bg-white"
              >
                <h3 className="text-lg font-semibold mb-4">
                  Get More Information
                </h3>
                <form onSubmit={handleContactFormSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Your Name</label>
                    <Input
                      type="text"
                      className="mt-1"
                      placeholder="Enter your name"
                      value={contactForm.name}
                      onChange={(e) =>
                        handleFormInputChange("name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      className="mt-1"
                      placeholder="Enter your email"
                      value={contactForm.email}
                      onChange={(e) =>
                        handleFormInputChange("email", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      type="tel"
                      className="mt-1"
                      placeholder="Enter your phone"
                      value={contactForm.phone}
                      onChange={(e) =>
                        handleFormInputChange("phone", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      className="mt-1"
                      rows={3}
                      placeholder="I'm interested in this property..."
                      value={contactForm.message}
                      onChange={(e) =>
                        handleFormInputChange("message", e.target.value)
                      }
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Inquiry"}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Similar Properties Section */}
          {similarProperties && similarProperties.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Similar Properties</h2>
                <Button variant="outline" asChild>
                  <Link href={`/properties?category=${property?.category}`}>
                    View More
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {similarProperties.slice(0, 3).map((similarProp) => (
                  <div key={similarProp.id} className="group cursor-pointer">
                    <Link href={`/properties/${similarProp.id}`}>
                      <div className="relative overflow-hidden rounded-lg">
                        <Image
                          src={getPrimaryImage(
                            similarProp.property_images || []
                          )}
                          alt={similarProp.title}
                          width={400}
                          height={300}
                          className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-dnx-orange text-white">
                            {getCategoryDisplay(similarProp.status)}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 px-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg group-hover:text-dnx-blue transition-colors">
                            {similarProp.title}
                          </h3>
                          <span className="text-xl font-bold text-dnx-blue">
                            {formatPrice(similarProp.price)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {similarProp.city}, {similarProp.state}
                          </span>
                        </div>
                        {/* <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {similarProp.category !== "land" && (
                            <>
                              <div className="flex items-center">
                                <Bed className="h-4 w-4 mr-1" />
                                <span>{similarProp.bedrooms || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Bath className="h-4 w-4 mr-1" />
                                <span>{similarProp.bathrooms || 0}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center">
                            <Maximize className="h-4 w-4 mr-1" />
                            <span>
                              {formatSquareFeet(similarProp.square_feet || 0)}
                            </span>
                          </div>
                        </div> */}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Properties Section */}
          {nearbyProperties && nearbyProperties.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Nearby Properties</h2>
                <Button variant="outline" asChild>
                  <Link
                    href={`/properties?city=${property?.city}&state=${property?.state}`}
                  >
                    View More
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {nearbyProperties.slice(0, 3).map((nearbyProp) => (
                  <div key={nearbyProp.id} className="group cursor-pointer">
                    <Link href={`/properties/${nearbyProp.id}`}>
                      <div className="relative overflow-hidden rounded-lg">
                        <Image
                          src={getPrimaryImage(
                            nearbyProp.property_images || []
                          )}
                          alt={nearbyProp.title}
                          width={400}
                          height={300}
                          className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-dnx-orange text-white">
                            {getCategoryDisplay(nearbyProp.status)}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg group-hover:text-dnx-blue transition-colors">
                            {nearbyProp.title}
                          </h3>
                          <span className="text-xl font-bold text-dnx-blue">
                            {formatPrice(nearbyProp.price)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {nearbyProp.city}, {nearbyProp.state}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {nearbyProp.category !== "land" && (
                            <>
                              <div className="flex items-center">
                                <Bed className="h-4 w-4 mr-1" />
                                <span>{nearbyProp.bedrooms || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Bath className="h-4 w-4 mr-1" />
                                <span>{nearbyProp.bathrooms || 0}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center">
                            <Maximize className="h-4 w-4 mr-1" />
                            <span>
                              {formatSquareFeet(nearbyProp.square_feet || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
