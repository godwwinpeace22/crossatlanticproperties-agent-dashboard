"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KYCFormData, BuyerType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

// KYC Form Schema
const kycSchema = z
  .object({
    buyer_type: z.enum(["individual", "company"]),

    // Personal Information (for individual)
    full_name: z.string().optional(),
    date_of_birth: z.string().optional(),
    nationality: z.string().optional(),
    occupation: z.string().optional(),

    // Company Information (for company)
    company_name: z.string().optional(),
    incorporation_date: z.string().optional(),
    country_of_incorporation: z.string().optional(),
    nature_of_business: z.string().optional(),

    // Common fields
    address: z.string().min(10, "Address must be at least 10 characters"),
    phone_number: z
      .string()
      .min(10, "Phone number must be at least 10 characters"),
    email_address: z.string().email("Invalid email address"),
    annual_income: z.string().optional(),
    investment_source: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.buyer_type === "individual") {
        return (
          data.full_name &&
          data.date_of_birth &&
          data.nationality &&
          data.occupation
        );
      } else {
        return (
          data.company_name &&
          data.incorporation_date &&
          data.country_of_incorporation &&
          data.nature_of_business
        );
      }
    },
    {
      message: "Please fill all required fields for the selected buyer type",
    }
  );

interface KYCFormProps {
  onSubmit: (data: KYCFormData, files: FileUploads) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FileUploads {
  government_id?: File;
  proof_of_address?: File;
  business_documents?: File[];
  application_fee_payment_proof?: File;
}

const COUNTRIES = [
  "Nigeria",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "South Africa",
  "Ghana",
  "Kenya",
  "Other",
];

const INVESTMENT_SOURCES = [
  "Salary/Employment Income",
  "Business Profits",
  "Investment Returns",
  "Inheritance",
  "Gift",
  "Loan",
  "Other",
];

export function KYCForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: KYCFormProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileUploads>({});
  const [step, setStep] = useState<"info" | "documents" | "payment">("info");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Initialize form hook at the top level - always called in the same order
  const form = useForm<z.infer<typeof kycSchema>>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      buyer_type: "individual",
      address: "",
      phone_number: "",
      email_address: "",
    },
  });

  // Add authentication check as an additional security layer
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          setIsAuthenticated(false);
          toast({
            title: "Authentication Required",
            description: "You must be signed in to access the KYC form.",
            variant: "destructive",
          });
          onCancel();
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        onCancel();
      }
    };

    checkAuth();
  }, [onCancel, toast]);

  // Don't render the form until authentication is verified
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-gray-600 mb-4">
          You must be signed in to access the KYC form.
        </p>
        <Button onClick={onCancel}>Close</Button>
      </div>
    );
  }

  const watchedBuyerType = form.watch("buyer_type");

  const handleFileUpload = (
    fileType: keyof FileUploads,
    file: File | File[]
  ) => {
    setFiles((prev) => ({
      ...prev,
      [fileType]: file,
    }));
  };

  const removeFile = (fileType: keyof FileUploads, index?: number) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      if (fileType === "business_documents" && typeof index === "number") {
        const businessDocs = prev.business_documents || [];
        newFiles.business_documents = businessDocs.filter(
          (_, i) => i !== index
        );
      } else {
        delete newFiles[fileType];
      }
      return newFiles;
    });
  };

  const onFormSubmit = async (data: z.infer<typeof kycSchema>) => {
    try {
      // Convert form data to KYCFormData format
      const formData: KYCFormData = {
        buyer_type: data.buyer_type,
        full_name: data.full_name,
        company_name: data.company_name,
        date_of_birth: data.date_of_birth,
        incorporation_date: data.incorporation_date,
        nationality: data.nationality,
        country_of_incorporation: data.country_of_incorporation,
        address: data.address,
        phone_number: data.phone_number,
        email_address: data.email_address,
        occupation: data.occupation,
        nature_of_business: data.nature_of_business,
        annual_income: data.annual_income,
        investment_source: data.investment_source,
      };

      await onSubmit(formData, files);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit KYC form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const FileUploadArea = ({
    label,
    fileType,
    accept,
    multiple = false,
    required = false,
  }: {
    label: string;
    fileType: keyof FileUploads;
    accept: string;
    multiple?: boolean;
    required?: boolean;
  }) => {
    const currentFiles = files[fileType];
    const hasFiles = multiple
      ? (currentFiles as File[])?.length > 0
      : !!currentFiles;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>

        {!hasFiles ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600 mb-2">
                Click to upload or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                {accept.split(",").join(", ")} up to 10MB
              </div>
            </div>
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                if (multiple) {
                  handleFileUpload(fileType, selectedFiles);
                } else {
                  handleFileUpload(fileType, selectedFiles[0]);
                }
              }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {multiple ? (
              (currentFiles as File[])?.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">{file.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileType, index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    {(currentFiles as File)?.name || "File uploaded"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileType)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Add more files button for multiple uploads */}
            {multiple && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    Add more files
                  </div>
                  <input
                    type="file"
                    accept={accept}
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files || []);
                      const existingFiles = (files[fileType] as File[]) || [];
                      handleFileUpload(fileType, [
                        ...existingFiles,
                        ...selectedFiles,
                      ]);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (step === "info") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>KYC Information Form</CardTitle>
          <CardDescription>
            Please provide accurate information for Know Your Customer
            verification. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(() => setStep("documents"))}
              className="space-y-6"
            >
              {/* Buyer Type Selection */}
              <FormField
                control={form.control}
                name="buyer_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am applying as *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual">Individual</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="company" id="company" />
                          <Label htmlFor="company">Company</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dynamic Fields Based on Buyer Type */}
              {watchedBuyerType === "individual" ? (
                <>
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your nationality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem
                                key={country}
                                value={country.toLowerCase()}
                              >
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your occupation"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incorporation_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Incorporation *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country_of_incorporation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Incorporation *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem
                                key={country}
                                value={country.toLowerCase()}
                              >
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nature_of_business"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nature of Business *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Describe your business"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Common Fields */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your full address"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+234 xxx xxx xxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="annual_income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Income (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your annual income"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This helps us understand your investment capacity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="investment_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source of Investment Funds (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source of funds" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INVESTMENT_SOURCES.map((source) => (
                          <SelectItem
                            key={source}
                            value={source.toLowerCase().replace(/\s+/g, "_")}
                          >
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit">Next: Upload Documents</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  if (step === "documents") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>
            Please upload the required documents for verification. All documents
            should be clear and readable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUploadArea
            label="Government ID (National ID, Passport, Driver's License)"
            fileType="government_id"
            accept=".jpg,.jpeg,.png,.pdf"
            required
          />

          <FileUploadArea
            label="Proof of Address (Utility Bill, Bank Statement - Max 3 months old)"
            fileType="proof_of_address"
            accept=".jpg,.jpeg,.png,.pdf"
            required
          />

          {watchedBuyerType === "company" && (
            <FileUploadArea
              label="Business Documents (CAC Certificate, Articles of Incorporation, etc.)"
              fileType="business_documents"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              required
            />
          )}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("info")}
            >
              Back
            </Button>
            <Button onClick={() => setStep("payment")}>Next: Payment</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "payment") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Application Fee Payment</CardTitle>
          <CardDescription>
            A one-time application fee of ₦10,000 is required to process your
            KYC application. This fee is non-refundable and applies per user
            account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Payment Details
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div>
                <strong>Amount:</strong> ₦10,000.00
              </div>
              <div>
                <strong>Account Name:</strong> Your Company Name
              </div>
              <div>
                <strong>Account Number:</strong> 1234567890
              </div>
              <div>
                <strong>Bank:</strong> Sample Bank
              </div>
              <div>
                <strong>Purpose:</strong> KYC Application Fee
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-1">
              Important Notes:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• This is a one-time fee per user account</li>
              <li>• Fee is required before KYC processing begins</li>
              <li>• Upload payment proof after making the transfer</li>
              <li>
                • Processing time is 2-3 business days after payment
                confirmation
              </li>
            </ul>
          </div>

          <FileUploadArea
            label="Payment Proof (Bank Transfer Receipt, Screenshot)"
            fileType="application_fee_payment_proof"
            accept=".jpg,.jpeg,.png,.pdf"
            required
          />

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("documents")}
            >
              Back
            </Button>
            <Button
              onClick={async () => {
                const formData = form.getValues();
                await onFormSubmit(formData);
              }}
              disabled={isSubmitting || !files.application_fee_payment_proof}
            >
              {isSubmitting ? "Submitting..." : "Submit KYC Application"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
