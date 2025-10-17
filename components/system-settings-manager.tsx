"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function ApplicationFeeSettings() {
  const [applicationFee, setApplicationFee] = useState<string>("10000");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const fetchApplicationFee = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "application_fee_amount")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setApplicationFee(data.setting_value);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load application fee",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const feeAmount = parseFloat(applicationFee);

    if (isNaN(feeAmount) || feeAmount < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid application fee amount",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("system_settings").upsert({
        setting_key: "application_fee_amount",
        setting_value: applicationFee,
        setting_type: "number",
        description: "Property interest application fee in Naira",
        category: "payments",
        is_public: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application fee updated successfully",
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save application fee",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchApplicationFee();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Application Fee Settings
        </CardTitle>
        <CardDescription>
          Set the property interest application fee amount in Naira
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="application-fee">Application Fee (₦)</Label>
            <Input
              id="application-fee"
              type="number"
              min="0"
              step="1000"
              value={applicationFee}
              onChange={(e) => setApplicationFee(e.target.value)}
              placeholder="10000"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              This is the amount users pay when submitting property interest
              applications
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Application Fee
              </>
            )}
          </Button>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
