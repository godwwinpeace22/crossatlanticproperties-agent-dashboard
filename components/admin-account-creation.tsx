"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  UserPlus,
  Mail,
  Shield,
  User,
  Briefcase,
} from "lucide-react";

interface CreateAccountFormData {
  email: string;
  fullName: string;
  role: "agent" | "buyer" | "staff" | "manager" | "admin";
  sendEmail: boolean;
  welcomeMessage?: string;
}

export function AdminAccountCreation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAccountFormData>({
    email: "",
    fullName: "",
    role: "buyer",
    sendEmail: true,
    welcomeMessage: "",
  });

  const { toast } = useToast();
  const supabase = createClient();

  const roleIcons = {
    admin: Shield,
    manager: Shield,
    agent: User,
    buyer: Briefcase,
    staff: UserPlus,
  };

  const roleDescriptions = {
    admin: "Full system access with all administrative privileges",
    manager: "Operational access without super admin privileges",
    agent:
      "Property sales agent with commission tracking and referral management",
    buyer: "Property buyer with interest submission and payment capabilities",
    staff: "Support staff with limited administrative access",
  };

  const generateTemporaryPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate a temporary password
      const tempPassword = generateTemporaryPassword();

      // Create the user account using admin API
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: formData.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email for admin-created accounts
          user_metadata: {
            full_name: formData.fullName,
            role: formData.role,
            created_by_admin: true,
          },
        });

      if (authError) throw authError;

      // Create or update profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authUser.user.id,
        email: formData.email,
        full_name: formData.fullName,
        role: formData.role,
        status: "active",
      });

      if (profileError) {
        // If profile creation fails, try to update instead (in case it was auto-created)
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.fullName,
            role: formData.role,
            status: "active",
          })
          .eq("id", authUser.user.id);

        if (updateError) throw updateError;
      }

      // Send welcome email if enabled
      if (formData.sendEmail) {
        try {
          const response = await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              fullName: formData.fullName,
              role: formData.role,
              temporaryPassword: tempPassword,
              welcomeMessage: formData.welcomeMessage,
            }),
          });

          if (!response.ok) {
            console.error("Failed to send welcome email");
          }
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
        }
      }

      toast({
        title: "Account Created Successfully",
        description: `${formData.fullName} has been added as a ${
          formData.role
        }. ${
          formData.sendEmail
            ? "A welcome email with login credentials has been sent."
            : `Temporary password: ${tempPassword} (Please share this securely)`
        }`,
      });

      // Reset form and close dialog
      setFormData({
        email: "",
        fullName: "",
        role: "buyer",
        sendEmail: true,
        welcomeMessage: "",
      });
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast({
        title: "Error Creating Account",
        description:
          error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Account Management
        </CardTitle>
        <CardDescription>
          Create new user accounts for agents, buyers, and staff members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Add a new user to the platform. They will receive login
                credentials via email.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Account Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleDescriptions).map(
                      ([role, description]) => {
                        const Icon = roleIcons[role as keyof typeof roleIcons];
                        return (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-start gap-2 py-1">
                              <Icon className="h-4 w-4 mt-0.5" />
                              <div>
                                <div className="font-medium capitalize">
                                  {role}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      },
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Email Notification */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, sendEmail: checked })
                  }
                />
                <Label htmlFor="sendEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send welcome email with login credentials
                </Label>
              </div>

              {/* Welcome Message */}
              {formData.sendEmail && (
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">
                    Custom Welcome Message (Optional)
                  </Label>
                  <Textarea
                    id="welcomeMessage"
                    placeholder="Add a personal welcome message..."
                    value={formData.welcomeMessage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        welcomeMessage: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Account Type Quick Stats */}
        <div className="mt-6">
          <div className="text-sm font-medium mb-3">Account Types</div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(roleDescriptions).map(([role, description]) => {
              const Icon = roleIcons[role as keyof typeof roleIcons];
              return (
                <div
                  key={role}
                  className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <Badge variant="outline" className="capitalize">
                      {role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
