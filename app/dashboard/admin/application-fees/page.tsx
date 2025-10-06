import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

export default async function InterestPaymentsPage() {
  const supabase = await createClient();

  // Check authentication and role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Fetch interest payments with related data
  const { data: payments, error } = await supabase
    .from("interest_payments")
    .select(
      `
      *,
      property:properties(id, name, price, city, state),
      user:profiles!interest_payments_user_id_fkey(id, full_name, email),
      property_interest:property_interests!interest_payments_property_interest_id_fkey(id, status, selected_payment_plan)
    `
    )
    .order("created_at", { ascending: false });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      success: "default",
      pending: "secondary",
      failed: "destructive",
      abandoned: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = {
    total: payments?.length || 0,
    successful:
      payments?.filter((p) => p.payment_status === "success").length || 0,
    pending:
      payments?.filter((p) => p.payment_status === "pending").length || 0,
    failed: payments?.filter((p) => p.payment_status === "failed").length || 0,
    totalRevenue:
      payments
        ?.filter((p) => p.payment_status === "success")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interest Application Payments</h1>
        <p className="text-muted-foreground mt-2">
          Track application fee payments for property interests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successful}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Application Fee Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Interest Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments && payments.length > 0 ? (
                  payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.user?.full_name || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.property?.name || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.property?.city}, {payment.property?.state}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.payment_status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">
                          {payment.payment_reference}
                        </span>
                      </TableCell>
                      <TableCell>
                        {payment.property_interest ? (
                          <Badge variant="outline">
                            {payment.property_interest.status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Not submitted
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(payment.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                        {payment.paid_at && (
                          <div className="text-xs text-muted-foreground">
                            Paid:{" "}
                            {formatDistanceToNow(new Date(payment.paid_at), {
                              addSuffix: true,
                            })}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
