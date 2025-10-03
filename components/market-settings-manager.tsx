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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketSetting {
  id: string;
  location_id: string;
  city_name: string;
  base_price: number;
  growth_rate: number;
  is_active: boolean;
}

export function MarketSettingsManager() {
  const [settings, setSettings] = useState<MarketSetting[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    base_price: string;
    growth_rate: string;
  }>({ base_price: "", growth_rate: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("market_analysis_settings")
        .select("*")
        .order("city_name");

      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleEdit = (setting: MarketSetting) => {
    setEditingId(setting.id);
    setEditValues({
      base_price: setting.base_price.toString(),
      growth_rate: (setting.growth_rate * 100).toFixed(2), // Convert to percentage
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ base_price: "", growth_rate: "" });
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("market_analysis_settings")
        .update({
          base_price: parseFloat(editValues.base_price),
          growth_rate: parseFloat(editValues.growth_rate) / 100, // Convert back to decimal
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Market settings updated successfully",
      });

      await fetchSettings();
      setEditingId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>City Market Data</CardTitle>
            <CardDescription>
              Configure base prices and monthly growth rates for each city
            </CardDescription>
          </div>
          <Button onClick={fetchSettings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City</TableHead>
              <TableHead>Base Price (₦)</TableHead>
              <TableHead>Monthly Growth Rate (%)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.map((setting) => {
              const isEditing = editingId === setting.id;

              return (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium">
                    {setting.city_name}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="1000000"
                        value={editValues.base_price}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            base_price: e.target.value,
                          })
                        }
                        className="w-[200px]"
                      />
                    ) : (
                      formatCurrency(setting.base_price)
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={editValues.growth_rate}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              growth_rate: e.target.value,
                            })
                          }
                          className="w-[100px]"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    ) : (
                      <span>{(setting.growth_rate * 100).toFixed(2)}%</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleSave(setting.id)}
                          size="sm"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleEdit(setting)}
                        size="sm"
                        variant="outline"
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {settings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No market settings found. Add cities in the Locations Manager first.
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">How to use:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              • <strong>Base Price:</strong> The starting property price for the
              city (in ₦)
            </li>
            <li>
              • <strong>Growth Rate:</strong> The monthly appreciation
              percentage (e.g., 4.5% means 4.5% growth per month)
            </li>
            <li>
              • These values are used in the Market Analysis page to generate
              the comparison chart
            </li>
            <li>
              • Higher growth rates will show steeper appreciation curves in the
              chart
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
