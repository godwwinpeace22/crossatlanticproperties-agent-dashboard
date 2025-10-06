import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { PropertyPaymentCard } from "@/components/property-payment-card";
import Link from "next/link";

// Cache for 1 minute (payment data changes frequently)
export const revalidate = 60;

export default async function MyPaymentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/dashboard/admin");
  }

  // Get user's installment payments with property interest details
  const { data: installmentPayments } = await supabase
    .from("installment_payments")
    .select(
      `
      *,
      property_interest:property_interests(
        *,
        property:properties(*)
      )
    `
    )
    .eq("property_interest.user_id", user.id)
    .order("due_date", { ascending: true });

  // Calculate payment statistics
  const payments = installmentPayments || [];
  const totalPaid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const totalDue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const pendingPayments = payments.filter(
    (payment) => payment.status === "pending"
  );
  const overduePayments = payments.filter(
    (payment) =>
      payment.status === "pending" && new Date(payment.due_date) < new Date()
  );

  const upcomingPayments = payments.filter(
    (payment) =>
      payment.status === "pending" &&
      new Date(payment.due_date) >= new Date() &&
      new Date(payment.due_date) <=
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
  );

  // Group payments by property
  const paymentsByProperty = payments.reduce((acc: any, payment) => {
    const propertyId = payment.property_interest?.property?.id;
    if (!propertyId) return acc;

    if (!acc[propertyId]) {
      acc[propertyId] = {
        property: payment.property_interest.property,
        payments: [],
      };
    }
    acc[propertyId].payments.push(payment);
    return acc;
  }, {});

  const propertiesWithPayments = Object.values(paymentsByProperty);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Property Interests</h1>
        <p className="text-muted-foreground">
          Track and manage your personal property investment payment schedules
        </p>
      </div>

      {/* Payment Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => p.status === "paid").length} payments
              completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(
                pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
              )}{" "}
              due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overduePayments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(
                overduePayments.reduce((sum, p) => sum + Number(p.amount), 0)
              )}{" "}
              overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Property Interests with Payment Schedules */}
      {propertiesWithPayments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Property Interests</h2>
          <div className="space-y-4">
            {propertiesWithPayments.map((propertyData: any) => (
              <PropertyPaymentCard
                key={propertyData.property.id}
                property={propertyData.property}
                payments={propertyData.payments}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Payments State */}
      {payments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Payment Schedule</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              You don't have any payment schedules yet. Express interest in a
              property and complete KYC verification to start investing.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/properties">Browse Properties</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/kyc">Complete KYC</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
