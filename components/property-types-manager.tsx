"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PropertyType, ImageFile } from "@/lib/types";

interface CustomImageFile {
  file: File;
  id: string;
  preview: string;
}

export function PropertyTypesManager() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<PropertyType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedImage, setSelectedImage] = useState<CustomImageFile | null>(
    null
  );
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  const fetchPropertyTypes = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("property_types")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setPropertyTypes(data || []);
    } catch (error) {
      console.error("Error fetching property types:", error);
      toast({
        title: "Error",
        description: "Failed to load property types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          description: "Image must be under 5MB",
          variant: "destructive",
        });
        return;
      }

      const preview = URL.createObjectURL(file);
      setSelectedImage({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview,
      });
    }
  };

  const removeSelectedImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.preview);
      setSelectedImage(null);
    }
  };

  const removeExistingImage = () => {
    setExistingImageUrl(null);
  };

  const toggleStatus = async (id: string, newStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("property_types")
        .update({ is_active: newStatus })
        .eq("id", id);

      if (error) throw error;

      await fetchPropertyTypes();
      toast({
        title: "Status updated",
        description: `Property type ${
          newStatus ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setSelectedImage(null);
    setExistingImageUrl(null);
    setEditingType(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Property type name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const supabase = createClient();
      let imageUrl = existingImageUrl;

      // Handle image upload if new image is selected
      if (selectedImage) {
        const fileExt = selectedImage.file.name.split(".").pop();
        const fileName = `property-types/${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, selectedImage.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const propertyTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image_url: imageUrl,
      };

      if (editingType) {
        // Update existing property type
        const { error } = await supabase
          .from("property_types")
          .update(propertyTypeData)
          .eq("id", editingType.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Property type updated successfully",
        });
      } else {
        // Create new property type
        const { error } = await supabase
          .from("property_types")
          .insert(propertyTypeData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Property type created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingType(null);
      resetForm();
      fetchPropertyTypes();
    } catch (error: any) {
      console.error("Error saving property type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save property type",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (propertyType: PropertyType) => {
    setEditingType(propertyType);
    setFormData({
      name: propertyType.name,
      description: propertyType.description || "",
    });
    setExistingImageUrl(propertyType.image_url || null);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (propertyType: PropertyType) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("property_types")
        .update({ is_active: !propertyType.is_active })
        .eq("id", propertyType.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Property type ${
          propertyType.is_active ? "deactivated" : "activated"
        } successfully`,
      });

      fetchPropertyTypes();
    } catch (error: any) {
      console.error("Error toggling property type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update property type",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (propertyType: PropertyType) => {
    if (
      !confirm(
        `Are you sure you want to delete "${propertyType.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("property_types")
        .delete()
        .eq("id", propertyType.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property type deleted successfully",
      });

      fetchPropertyTypes();
    } catch (error: any) {
      console.error("Error deleting property type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete property type",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Property Types Management</CardTitle>
            <CardDescription>
              Manage estate names and development types for property listings
              (e.g., "Clearview Estate", "Rivervalley Estate", "Suncity Estate
              Qwarimpa")
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingType(null);
                  setFormData({ name: "", description: "" });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Property Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? "Edit Property Type" : "Add New Property Type"}
                </DialogTitle>
                <DialogDescription>
                  Create estate names or development types (e.g., "Clearview
                  Estate", "Rivervalley Estate").
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="name">Property Type Name</label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Clearview Estate, Rivervalley Estate"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="description">Description</label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Optional description about this estate or development..."
                      rows={3}
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div className="grid gap-2">
                    <label>Property Type Image</label>

                    {/* Existing Image (Edit Mode) */}
                    {existingImageUrl && !selectedImage && (
                      <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden max-w-sm">
                        <Image
                          src={existingImageUrl}
                          alt="Current property type image"
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-2">
                          <button
                            type="button"
                            onClick={removeExistingImage}
                            className="w-full p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs"
                          >
                            Remove Current Image
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upload New Image */}
                    {!selectedImage && !existingImageUrl && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            Upload Property Type Image
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="mt-2 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    )}

                    {/* New Image Preview */}
                    {selectedImage && (
                      <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden max-w-sm">
                        <Image
                          src={selectedImage.preview}
                          alt="New property type image"
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-2">
                          <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="w-full p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs"
                          >
                            Remove Selected Image
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replace Image (Edit Mode with existing) */}
                    {existingImageUrl && !selectedImage && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">
                          Upload a new image to replace the current one
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingType ? "Update" : "Create"} Property Type
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading property types...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Estate/Development Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertyTypes.map((propertyType) => (
                <TableRow key={propertyType.id}>
                  <TableCell>
                    {propertyType.image_url ? (
                      <div className="w-16 h-16 relative rounded-md overflow-hidden">
                        <Image
                          src={propertyType.image_url}
                          alt={propertyType.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {propertyType.name}
                  </TableCell>
                  <TableCell>{propertyType.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={propertyType.is_active ? "default" : "secondary"}
                    >
                      {propertyType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(propertyType)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleStatus(propertyType.id, !propertyType.is_active)
                        }
                      >
                        {propertyType.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
