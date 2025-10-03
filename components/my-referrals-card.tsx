"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";

interface PropertyInterest {
  id: string;
  user_id: string;
  property_id: string;
  status: string;
  selected_payment_plan: string;
  referral_code?: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
  property: {
    name: string;
    price: number;
    city?: string;
  };
}

interface MyReferralsCardProps {
  referrals: PropertyInterest[];
  referralCode: string;
}

export function MyReferralsCard({
  referrals,
  referralCode,
}: MyReferralsCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      completed: { variant: "default" },
      approved: { variant: "default" },
      pending: { variant: "secondary" },
      payment_pending: { variant: "secondary" },
      rejected: { variant: "destructive" },
      withdrawn: { variant: "outline" },
    };

    const config = statusConfig[status] || { variant: "secondary" };

    return (
      <Badge variant={config.variant} className="capitalize">
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const totalValue = referrals.reduce(
    (sum, referral) => sum + Number(referral.property.price),
    0
  );

  const completedReferrals = referrals.filter(
    (r) => r.status === "completed"
  ).length;
  const pendingReferrals = referrals.filter(
    (r) => r.status === "pending" || r.status === "approved"
  ).length;

  if (referrals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Referrals
          </CardTitle>
          <CardDescription>
            Property interests using your referral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Share your referral code with potential buyers to start earning
              commissions
            </p>
            <div className="bg-muted p-4 rounded-lg inline-block">
              <p className="text-xs text-muted-foreground mb-1">
                Your Referral Code
              </p>
              <p className="text-sm font-mono font-bold break-all">
                {referralCode || "Loading..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Referrals ({referrals.length})
            </CardTitle>
            <CardDescription>
              Property interests using your referral
            </CardDescription>
          </div>
          <Link href="/dashboard/referrals">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Total Value
              </span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Completed
              </span>
            </div>
            <p className="text-lg font-bold">{completedReferrals}</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Pending
              </span>
            </div>
            <p className="text-lg font-bold">{pendingReferrals}</p>
          </div>
        </div>

        {/* Recent Referrals List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Recent Referrals</h3>
          {referrals.slice(0, 5).map((referral) => (
            <div
              key={referral.id}
              className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(referral.status)}
                  <p className="font-medium text-sm truncate">
                    {referral.profiles?.full_name || referral.profiles?.email}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground truncate mb-1">
                  {referral.property.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(referral.property.price)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(referral.created_at)}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                {getStatusBadge(referral.status)}
              </div>
            </div>
          ))}
        </div>

        {referrals.length > 5 && (
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard/referrals">
              View All {referrals.length} Referrals
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
