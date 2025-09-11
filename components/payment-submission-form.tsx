"use client";

import type React from "react";

import { useState } from "react";
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

interface PaymentSubmissionFormProps {
  properties: Array<{
    id: string;
    name: string;
    price: string;
  }>;
  agents: Array<{
    id: string;
    email: string;
    full_name: string | null;
  }>;
}

export function PaymentSubmissionForm({
  properties,
  agents,
}: PaymentSubmissionFormProps) {
  const [formData, setFormData] = useState({
    property_id: "",
    buyer_email: "",
    buyer_name: "",
    amount: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const selectedProperty = properties.find(
    (p) => p.id === formData.property_id
  );

  const handleAgentSelect = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setFormData({
        ...formData,
        buyer_email: agent.email,
        buyer_name: agent.full_name || agent.email,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Verify the buyer exists in the system
      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.buyer_email)
        .single();

      if (!buyerProfile) {
        throw new Error(
          "Buyer must have an account in the system. Please ask them to sign up first."
        );
      }

      const submissionData = {
        property_id: formData.property_id,
        buyer_email: formData.buyer_email,
        buyer_name: formData.buyer_name,
        amount: Number.parseFloat(formData.amount),
        notes: formData.notes || null,
        submitter_id: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error } = await supabase
        .from("payment_submissions")
        .insert([submissionData]);

      if (error) throw error;

      router.push("/dashboard/submissions");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Payment Submission Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Select
              value={formData.property_id}
              onValueChange={(value) => {
                const property = properties.find((p) => p.id === value);
                setFormData({
                  ...formData,
                  property_id: value,
                  amount: property?.price || "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property purchased" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name} - ${Number(property.price).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Buyer (Select from existing agents)</Label>
            <Select onValueChange={handleAgentSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select buyer from agents" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.full_name || agent.email} ({agent.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buyer_email">Buyer Email</Label>
              <Input
                id="buyer_email"
                type="email"
                required
                value={formData.buyer_email}
                onChange={(e) =>
                  setFormData({ ...formData, buyer_email: e.target.value })
                }
                placeholder="buyer@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer_name">Buyer Name</Label>
              <Input
                id="buyer_name"
                required
                value={formData.buyer_name}
                onChange={(e) =>
                  setFormData({ ...formData, buyer_name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount Paid ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder={selectedProperty ? selectedProperty.price : "0.00"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional details about the payment..."
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Payment"}
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
