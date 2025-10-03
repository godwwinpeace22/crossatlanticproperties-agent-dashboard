"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";

interface PropertyInterestsTableProps {
  interests: any[];
}

export function PropertyInterestsTable({
  interests,
}: PropertyInterestsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInterests = interests.filter((interest) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      interest.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      interest.profiles?.email?.toLowerCase().includes(searchLower) ||
      interest.property?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string; className: string }> =
      {
        payment_pending: {
          variant: "secondary",
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30",
        },
        pending: {
          variant: "secondary",
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30",
        },
        approved: {
          variant: "secondary",
          className: "bg-green-100 text-green-800 dark:bg-green-900/30",
        },
        rejected: {
          variant: "secondary",
          className: "bg-red-100 text-red-800 dark:bg-red-900/30",
        },
        withdrawn: {
          variant: "secondary",
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30",
        },
        completed: {
          variant: "secondary",
          className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30",
        },
      };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant="secondary" className={config.className}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name, email, or property..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInterests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No property interests found
                </TableCell>
              </TableRow>
            ) : (
              filteredInterests.map((interest) => (
                <TableRow key={interest.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {interest.profiles?.full_name || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {interest.profiles?.email || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {interest.property?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {interest.property?.city}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(interest.property?.price || 0)}
                  </TableCell>
                  <TableCell>{getStatusBadge(interest.status)}</TableCell>
                  <TableCell>
                    {interest.kyc_submission ? (
                      <Badge
                        variant="secondary"
                        className={
                          interest.kyc_submission.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : interest.kyc_submission.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {interest.kyc_submission.status.toUpperCase()}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100">
                        NO KYC
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(interest.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        href={`/dashboard/admin/property-interests/${interest.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
