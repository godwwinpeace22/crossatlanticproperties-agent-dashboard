"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardAction,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Percent, Save, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface CommissionSetting {
  id: string;
  level: number;
  percentage: string;
}

interface CommissionSettingsProps {
  settings: CommissionSetting[];
}

export function CommissionSettings({ settings }: CommissionSettingsProps) {
  const [editingSettings, setEditingSettings] = useState<{
    [key: string]: string;
  }>({});
  const [newLevel, setNewLevel] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const handlePercentageChange = (settingId: string, value: string) => {
    setEditingSettings({ ...editingSettings, [settingId]: value });
  };

  const handleSave = async (settingId: string) => {
    setIsLoading(true);

    try {
      const newPercentage = editingSettings[settingId];
      if (!newPercentage) return;

      const { error } = await supabase
        .from("commission_settings")
        .update({ percentage: Number.parseFloat(newPercentage) })
        .eq("id", settingId);

      if (error) throw error;

      // Clear editing state
      const newEditingSettings = { ...editingSettings };
      delete newEditingSettings[settingId];
      setEditingSettings(newEditingSettings);

      toast({
        title: "Success",
        description: `Commission percentage updated to ${newPercentage}%`,
      });

      router.refresh();
    } catch (error) {
      console.error("Error updating commission setting:", error);
      toast({
        title: "Error",
        description: "Failed to update commission setting",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLevel = async () => {
    if (!newLevel || !newPercentage) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from("commission_settings").insert([
        {
          level: Number.parseInt(newLevel),
          percentage: Number.parseFloat(newPercentage),
        },
      ]);

      if (error) throw error;

      setNewLevel("");
      setNewPercentage("");

      toast({
        title: "Success",
        description: `Commission level ${newLevel} added successfully with ${newPercentage}% commission rate`,
      });

      router.refresh();
    } catch (error) {
      console.error("Error adding commission level:", error);
      toast({
        title: "Error",
        description: "Failed to add commission level",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (settingId: string) => {
    if (!confirm("Are you sure you want to delete this commission level?"))
      return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("commission_settings")
        .delete()
        .eq("id", settingId);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error("Error deleting commission setting:", error);
      toast({
        title: "Error",
        description: "Failed to delete commission setting",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-col flex space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>
            Configure commission percentages for each level in the MLM hierarchy
          </CardDescription>
          <CardAction>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Commission Level</DialogTitle>
                </DialogHeader>

                <div className="flex gap-4 items-end pt-5">
                  <div className="space-y-2">
                    <Label htmlFor="newLevel">Level</Label>
                    <Input
                      id="newLevel"
                      type="number"
                      min="1"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      placeholder="6"
                      className="w-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPercentage">Percentage</Label>
                    <Input
                      id="newPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={newPercentage}
                      onChange={(e) => setNewPercentage(e.target.value)}
                      placeholder="0.25"
                      className="w-24"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddLevel}
                    disabled={!newLevel || !newPercentage || isLoading}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Current Settings Table */}
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Commission Percentage</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-medium">
                        Level {setting.level}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {editingSettings[setting.id] !== undefined ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={editingSettings[setting.id]}
                              onChange={(e) =>
                                handlePercentageChange(
                                  setting.id,
                                  e.target.value
                                )
                              }
                              className="w-20"
                            />
                          ) : (
                            <span className="flex items-center">
                              <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                              {Number(setting.percentage).toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {setting.level === 1 && "Direct downline commission"}
                        {setting.level === 2 && "Second level commission"}
                        {setting.level === 3 && "Third level commission"}
                        {setting.level > 3 &&
                          `Level ${setting.level} commission`}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {editingSettings[setting.id] !== undefined ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSave(setting.id)}
                                disabled={isLoading}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newEditingSettings = {
                                    ...editingSettings,
                                  };
                                  delete newEditingSettings[setting.id];
                                  setEditingSettings(newEditingSettings);
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePercentageChange(
                                    setting.id,
                                    setting.percentage
                                  )
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(setting.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Structure Info */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">How Commission Calculation Works</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • When a payment is approved, commissions are calculated for all
            uplines
          </li>
          <li>
            • Each level receives the specified percentage of the sale amount
          </li>
          <li>
            • Commissions are created as individual records for transparency
          </li>
          <li>• Changes to commission rates only affect future sales</li>
        </ul>
      </div>
    </div>
  );
}
