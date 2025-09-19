"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyFormProps {
  property?: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    location: string | null;
    location_id: string | null;
    category: string | null;
    status: string;
    latitude: number | null;
    longitude: number | null;
    lot_size: number | null;
  };
}

export function PropertyForm({ property }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: property?.name || "",
    description: property?.description || "",
    price: property?.price || "",
    location: property?.location || "",
    location_id: property?.location_id || "",
    category: property?.category || "",
    status: property?.status || "available",
    latitude: property?.latitude?.toString() || "",
    longitude: property?.longitude?.toString() || "",
    lot_size: property?.lot_size?.toString() || "",
  });
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string; country: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Fetch available locations
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, country")
        .eq("is_active", true)
        .order("name");

      if (data && !error) {
        setLocations(data);
      }
    };

    fetchLocations();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const propertyData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        location_id: formData.location_id || null,
        category: formData.category,
        status: formData.status,
        latitude: formData.latitude
          ? Number.parseFloat(formData.latitude)
          : null,
        longitude: formData.longitude
          ? Number.parseFloat(formData.longitude)
          : null,
        lot_size: formData.lot_size
          ? Number.parseFloat(formData.lot_size)
          : null,
      };

      if (property) {
        // Update existing property
        const { error } = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", property.id);

        if (error) throw error;
      } else {
        // Create new property
        const { error } = await supabase
          .from("properties")
          .insert([propertyData]);

        if (error) throw error;
      }

      router.push("/dashboard/properties");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{property ? "Edit Property" : "Property Details"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Luxury Villa in Downtown"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="500000"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location_id">City/Location</Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, location_id: value })
                }
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Property Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GPS Coordinates Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">GPS Location (Optional)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  placeholder="e.g., 9.0579"
                />
                <p className="text-xs text-muted-foreground">
                  Enter latitude coordinates (e.g., 9.0579 for Abuja)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  placeholder="e.g., 7.4951"
                />
                <p className="text-xs text-muted-foreground">
                  Enter longitude coordinates (e.g., 7.4951 for Abuja)
                </p>
              </div>
            </div>
          </div>

          {/* Land Size for Land Properties */}
          {formData.category === "land" && (
            <div className="space-y-2">
              <Label htmlFor="lot_size">Land Size (sqm)</Label>
              <Input
                id="lot_size"
                type="number"
                step="0.01"
                value={formData.lot_size}
                onChange={(e) =>
                  setFormData({ ...formData, lot_size: e.target.value })
                }
                placeholder="e.g., 500"
              />
              <p className="text-xs text-muted-foreground">
                Enter land size in square meters (sqm)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the property features, amenities, etc."
              rows={4}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : property
                ? "Update Property"
                : "Create Property"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
