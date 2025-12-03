"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bath,
  Bed,
  ChevronLeft,
  Heart,
  Home,
  MapPin,
  Maximize,
  Share2,
  Phone,
  Expand,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import PropertyGallery from "@/components/property-gallery";
import { PropertyDetailSkeleton } from "@/components/property-detail-skeleton";
import { PropertyInterestWorkflow } from "@/components/property-interest-workflow";
import { createClient } from "@/lib/supabase/client";
import { usePropertyInterest } from "@/hooks/use-property-interest";
import {
  useProperty,
  usePropertyImages,
  useSimilarProperties,
  useNearbyProperties,
  useFavoriteStatus,
} from "@/hooks/use-property-data";
import { PropertyShareButton } from "@/components/property-share-button";
import type { PropertyImage } from "@/lib/types";

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
  const {
    hasInterest,
    status: interestStatus,
    isLoading: isCheckingInterest,
  } = usePropertyInterest(propertyId);

  // Form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "I'm interested in this property...",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInterestWorkflowOpen, setIsInterestWorkflowOpen] = useState(false);

  // Derived state
  const isLoading = isLoadingProperty || isLoadingImages;
  const isError = propertyError;

  // Type-safe property access helpers
  const getPropertyTitle = () => property?.title || property?.name || "";
  const getPropertyPrice = () =>
    property?.promotional_price || property?.price || 0;
  const getOriginalPrice = () =>
    property?.original_price || property?.price || 0;
  const getSquareFeet = () => property?.lotSize;

  // Helper functions to format data
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  const formatSquareFeet = (sqft: number) => {
    return new Intl.NumberFormat("en-US").format(sqft) + " sqm";
  };

  const getCategoryDisplay = (status: string) => {
    return status === "available"
      ? "For Sale"
      : status === "sold"
      ? "Sold"
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getInterestStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      payment_pending: { label: "Payment Pending", color: "text-orange-600" },
      payment_failed: { label: "Payment Failed", color: "text-red-600" },
      pending: { label: "Under Review", color: "text-blue-600" },
      approved: { label: "Approved", color: "text-green-600" },
      rejected: { label: "Rejected", color: "text-red-600" },
      withdrawn: { label: "Withdrawn", color: "text-gray-600" },
      completed: { label: "Completed", color: "text-green-600" },
    };

    return statusMap[status] || { label: status, color: "text-gray-600" };
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
      title: getPropertyTitle(),
      text: `Check out this amazing property: ${getPropertyTitle()}`,
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
                      {getPropertyTitle()}{" "}
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
                        {property.lotSize} sqm
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
                      {/* <li className="flex justify-between">
                        <span className="text-muted-foreground">
                          Floor Area
                        </span>
                        <span className="font-medium">
                          {property?.sqft} sqm
                        </span>
                      </li> */}
                      {property?.category == "land" && (
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">
                            Lot Size
                          </span>
                          <span className="font-medium">
                            {property?.lotSize
                              ? `${property.lotSize} sqm`
                              : "N/A"}
                          </span>
                        </li>
                      )}
                    </ul>
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
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-400 mb-2">
                        <Home className="h-12 w-12 mx-auto mb-4" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No Floor Plan Available
                      </h4>
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

                  {property.latitude && property.longitude && (
                    <div className="aspect-video overflow-hidden rounded-lg border">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        title="Property Location Map"
                      />
                    </div>
                  )}

                  {property.latitude && property.longitude && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>Interactive map showing property location</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
                          window.open(mapUrl, "_blank");
                        }}
                      >
                        Open in Google Maps
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Price Card */}
              <div className="rounded-lg border border-gray-200 p-6 bg-white">
                <div className="text-center mb-4">
                  {/* Check if promotional pricing is active */}
                  {property?.is_promotional &&
                  property?.promotional_price &&
                  property?.promotion_start_date &&
                  property?.promotion_end_date &&
                  new Date() >= new Date(property.promotion_start_date) &&
                  new Date() <= new Date(property.promotion_end_date) ? (
                    <div className="space-y-2">
                      <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-3">
                        <div className="text-red-600 font-semibold text-sm mb-1">
                          🎉 LIMITED TIME OFFER
                        </div>
                        <div className="text-red-800 text-xs">
                          Save{" "}
                          {Math.round(
                            ((getOriginalPrice() - property.promotional_price) /
                              getOriginalPrice()) *
                              100
                          )}
                          % - Offer ends{" "}
                          {new Date(
                            property.promotion_end_date
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-lg text-gray-500 line-through">
                        {formatPrice(getOriginalPrice())}
                      </div>
                      <h2 className="text-3xl font-bold text-red-600">
                        {formatPrice(property.promotional_price)}
                      </h2>
                      <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        You Save{" "}
                        {formatPrice(
                          getOriginalPrice() - property.promotional_price
                        )}
                        !
                      </div>
                    </div>
                  ) : (
                    <h2 className="text-3xl font-bold text-primary">
                      {formatPrice(getOriginalPrice())}
                    </h2>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {property.category === "land" ? "" : "Total price"}
                  </p>
                </div>

                <div className="space-y-3">
                  {hasInterest ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        size="lg"
                        disabled
                        variant="secondary"
                      >
                        ✓ Application already submitted
                      </Button>
                      <p className="text-xs text-center">
                        Status:{" "}
                        <span
                          className={`font-semibold ${
                            getInterestStatusDisplay(interestStatus || "").color
                          }`}
                        >
                          {getInterestStatusDisplay(interestStatus || "").label}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                      size="lg"
                      onClick={() => setIsInterestWorkflowOpen(true)}
                      disabled={isCheckingInterest}
                    >
                      {isCheckingInterest
                        ? "Checking..."
                        : "Apply for this property"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
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
                  <PropertyShareButton
                    propertyTitle={getPropertyTitle()}
                    propertyUrl={
                      typeof window !== "undefined" ? window.location.href : ""
                    }
                    fullWidth
                  />
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
                          src={getPrimaryImage(similarProp.images || [])}
                          alt={similarProp.title || similarProp.name}
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
                            {similarProp.title || (similarProp as any).name}
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
                              {formatSquareFeet(similarProp.square_feet || parseInt(similarProp.sqft || "0") || 0)}
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
                          src={getPrimaryImage(nearbyProp.images || [])}
                          alt={nearbyProp.title || nearbyProp.name}
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
                            {nearbyProp.title || nearbyProp.name}
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
                              {formatSquareFeet(
                                nearbyProp.lotSize ||
                                  parseInt(nearbyProp.sqft || "0") ||
                                  0
                              )}
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

          {/* Property Interest Workflow */}
          {property && (
            <PropertyInterestWorkflow
              property={{
                ...property,
                name: getPropertyTitle(),
                title: getPropertyTitle(),
              }}
              isOpen={isInterestWorkflowOpen}
              onClose={() => setIsInterestWorkflowOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
