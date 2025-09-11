"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, FileText, DollarSign, Calendar, RefreshCw } from "lucide-react";
import useSWR from "swr";

interface Submission {
  id: string;
  amount: number;
  buyer_name: string;
  buyer_email: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  notes?: string;
  properties?: {
    name: string;
    price: number;
  };
  reviewed_by_profile?: {
    full_name: string;
  };
}

const fetchSubmissions = async (): Promise<Submission[]> => {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No user found");

  const { data, error } = await supabase
    .from("payment_submissions")
    .select(
      `
      *,
      properties (name, price),
      reviewed_by_profile:profiles!payment_submissions_reviewed_by_fkey (full_name)
    `
    )
    .eq("submitter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export default function SubmissionsPage() {
  const {
    data: submissions,
    error,
    isLoading,
    mutate,
  } = useSWR<Submission[]>("submissions", fetchSubmissions, {
    refreshInterval: 30000, // Auto-refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const handleRefresh = () => {
    mutate(); // Manually trigger revalidation
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (error && error.message !== "No user found") {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive">
            Error loading submissions: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Submissions</h1>
          <p className="text-muted-foreground">
            Track your payment submissions and their approval status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh data"
            className="cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button asChild>
            <Link href="/dashboard/submissions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Submission
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !submissions || submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by submitting your first payment to build your network.
            </p>
            <Button asChild>
              <Link href="/dashboard/submissions/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Submission
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {submission.properties?.name}
                    </CardTitle>
                    <CardDescription>
                      Buyer: {submission.buyer_name} ({submission.buyer_email})
                    </CardDescription>
                  </div>
                  <Badge
                    variant={getStatusColor(submission.status)}
                    className="capitalize"
                  >
                    {submission.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">
                        ${Number(submission.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="font-semibold">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {submission.reviewed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Reviewed by
                      </p>
                      <p className="font-semibold">
                        {submission.reviewed_by_profile?.full_name || "Admin"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.reviewed_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {submission.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm">{submission.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
