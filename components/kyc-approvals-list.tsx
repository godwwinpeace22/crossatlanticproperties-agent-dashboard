"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Calendar, User, Building } from "lucide-react";
import { formatDate } from "@/lib/format";
import { KYCSubmission } from "@/lib/types";
import { KYCDetailsForm } from "./kyc-details-form";

interface KYCSubmissionWithProfile extends KYCSubmission {
  profiles: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
}

interface KYCApprovalsListProps {
  submissions: KYCSubmissionWithProfile[];
}

export function KYCApprovalsList({ submissions }: KYCApprovalsListProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<KYCSubmissionWithProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buyerTypeFilter, setBuyerTypeFilter] = useState<string>("all");

  const filteredSubmissions = submissions.filter((submission) => {
    const statusMatch =
      statusFilter === "all" || submission.status === statusFilter;
    const buyerTypeMatch =
      buyerTypeFilter === "all" || submission.buyer_type === buyerTypeFilter;
    return statusMatch && buyerTypeMatch;
  });

  const openDialog = (submission: KYCSubmissionWithProfile) => {
    setSelectedSubmission(submission);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedSubmission(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="text-white">
            Rejected
          </Badge>
        );
      case "needs_revision":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Needs Revision
          </Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getApplicationFeeStatus = (submission: KYCSubmissionWithProfile) => {
    if (submission.application_fee_approved) {
      return <Badge className="bg-green-500">Fee Approved</Badge>;
    } else if (submission.application_fee_paid) {
      return <Badge variant="secondary">Fee Paid - Pending Review</Badge>;
    } else {
      return <Badge variant="outline">Fee Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="needs_revision">Needs Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Buyer Type</Label>
              <Select
                value={buyerTypeFilter}
                onValueChange={setBuyerTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {submissions.filter((s) => s.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter((s) => s.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {submissions.filter((s) => s.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Submissions</CardTitle>
          <CardDescription>
            {filteredSubmissions.length} submission(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Application Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {submission.profiles.full_name ||
                            submission.profiles.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {submission.profiles.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {submission.buyer_type === "individual" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Building className="h-4 w-4" />
                        )}
                        <span className="capitalize">
                          {submission.buyer_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getApplicationFeeStatus(submission)}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(submission.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(submission)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Render dialog */}
      {selectedSubmission && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog();
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>KYC Application Details</DialogTitle>
              <DialogDescription>
                Review and manage KYC submission for{" "}
                {selectedSubmission.profiles.full_name ||
                  selectedSubmission.profiles.email}
              </DialogDescription>
            </DialogHeader>

            <KYCDetailsForm
              submission={selectedSubmission}
              onClose={closeDialog}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
