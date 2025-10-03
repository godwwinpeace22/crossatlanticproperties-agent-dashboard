"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function PaymentVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading"
  );
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setError("No payment reference provided");
      return;
    }

    verifyPayment();
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(
        `/api/payments/verify?reference=${reference}`
      );
      const data = await response.json();

      if (data.success && data.data.status === "success") {
        setStatus("success");
        setPaymentData(data.data);
      } else {
        setStatus("failed");
        setError(data.error || "Payment verification failed");
      }
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Clock className="h-16 w-16 mx-auto text-blue-600 animate-spin" />
              <h2 className="text-2xl font-bold">Verifying Payment</h2>
              <p className="text-gray-600">
                Please wait while we verify your payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
              <CardTitle className="text-2xl text-green-800">
                Interest Submitted Successfully!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-bold text-green-800">
                  {paymentData?.amount
                    ? formatPrice(paymentData.amount)
                    : "₦10,000"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono text-sm">{reference}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium text-green-800">✓ Payment Confirmed</p>
              <p className="font-medium text-green-800">✓ Interest Submitted</p>
              <div className="mt-4 space-y-1">
                <p>Your property interest has been successfully submitted!</p>
                <p>
                  Our team will review your application and contact you shortly.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => router.replace("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.replace("/properties")}
                className="w-full"
              >
                Browse More Properties
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 mx-auto text-red-600" />
            <CardTitle className="text-2xl text-red-800">
              Payment Failed
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-center">
              {error || "We could not verify your payment. Please try again."}
            </p>
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentVerifyLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Clock className="h-16 w-16 mx-auto text-blue-600 animate-spin" />
            <h2 className="text-2xl font-bold">Loading</h2>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={<PaymentVerifyLoading />}>
      <PaymentVerifyContent />
    </Suspense>
  );
}
