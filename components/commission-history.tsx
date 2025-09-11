"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, DollarSign, TrendingUp } from "lucide-react";

interface Commission {
  id: string;
  amount: string;
  percentage: string;
  level: number;
  created_at: string;
  purchase?: {
    amount: string;
    created_at: string;
    property: { name: string };
    buyer: { full_name: string | null; email: string };
    seller: { full_name: string | null; email: string };
  } | null;
}

interface CommissionHistoryProps {
  commissions: Commission[];
}

export function CommissionHistory({ commissions }: CommissionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filteredCommissions = commissions
    .filter((commission) => {
      // Skip commissions without purchase data
      if (!commission.purchase) return false;

      const matchesSearch =
        commission.purchase.property?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        commission.purchase.buyer?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        commission.purchase.buyer?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesLevel =
        levelFilter === "all" || commission.level.toString() === levelFilter;

      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return Number(b.amount) - Number(a.amount);
        case "level":
          return a.level - b.level;
        case "date":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  const getLevelColor = (level: number) => {
    const colors = ["default", "secondary", "outline", "destructive"];
    return colors[level - 1] || "outline";
  };

  if (commissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Commissions Yet</h3>
          <p className="text-muted-foreground text-center">
            Your commission history will appear here once you start earning from
            your network.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission History</CardTitle>
        <CardDescription>
          Detailed record of all your commission earnings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by property or buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="1">Level 1</SelectItem>
              <SelectItem value="2">Level 2</SelectItem>
              <SelectItem value="3">Level 3</SelectItem>
              <SelectItem value="4">Level 4</SelectItem>
              <SelectItem value="5">Level 5</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="level">Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Commission Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Sale Amount</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No commissions found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(commission.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">
                        {commission.purchase?.property?.name || "N/A"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        {commission.purchase?.buyer?.full_name ||
                          commission.purchase?.buyer?.email ||
                          "N/A"}
                      </div>
                      {commission.purchase?.buyer?.full_name && (
                        <div className="text-xs text-muted-foreground">
                          {commission.purchase.buyer.email}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                        {commission.purchase?.amount
                          ? Number(commission.purchase.amount).toLocaleString()
                          : "N/A"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getLevelColor(commission.level) as any}>
                        Level {commission.level}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1 text-muted-foreground" />
                        {Number(commission.percentage).toFixed(1)}%
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="font-semibold text-green-600">
                        +${Number(commission.amount).toFixed(2)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <span>
            Showing {filteredCommissions.length} of {commissions.length}{" "}
            commissions
          </span>
          <span>
            Total: $
            {filteredCommissions
              .reduce((sum, c) => sum + Number(c.amount), 0)
              .toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
