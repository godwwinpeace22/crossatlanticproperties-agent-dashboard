import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/paystack";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get reference from query params
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const verification = await verifyPayment(reference);

    if (!verification.status) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Check if payment record exists first
    const { data: existingPayment, error: checkError } = await supabase
      .from("interest_payments")
      .select("*")
      .eq("payment_reference", reference)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingPayment) {
      console.error("Payment record not found:", {
        reference,
        user_id: user.id,
        error: checkError,
      });
      return NextResponse.json(
        {
          error:
            "Payment record not found. The payment may not have been initialized properly.",
        },
        { status: 404 }
      );
    }

    // Update payment record in database
    const { data: paymentRecord, error: dbError } = await supabase
      .from("interest_payments")
      .update({
        payment_status:
          verification.data.status === "success" ? "success" : "failed",
        paystack_response: verification.data,
        paid_at: verification.data.paid_at
          ? new Date(verification.data.paid_at).toISOString()
          : null,
      })
      .eq("payment_reference", reference)
      .eq("user_id", user.id)
      .select()
      .single();

    if (dbError) {
      console.error("Error updating payment record:", dbError);
      return NextResponse.json(
        { error: "Failed to update payment record" },
        { status: 500 }
      );
    }

    // Update property interest status based on payment result
    let interestUpdated = false;
    if (paymentRecord.payment_status === "success") {
      const { error: interestError } = await supabase
        .from("property_interests")
        .update({
          status: "pending", // Change from payment_pending to pending
        })
        .eq("interest_payment_id", paymentRecord.id)
        .eq("status", "payment_pending");

      if (interestError) {
        console.error("Error updating interest status:", interestError);
        // Don't fail the whole verification, just log the error
      } else {
        interestUpdated = true;
        console.log(
          "Property interest status updated from payment_pending to pending"
        );
      }
    } else if (paymentRecord.payment_status === "failed") {
      // Mark interest as failed if payment failed
      const { error: interestError } = await supabase
        .from("property_interests")
        .update({
          status: "payment_failed",
        })
        .eq("interest_payment_id", paymentRecord.id)
        .eq("status", "payment_pending");

      if (interestError) {
        console.error("Error updating interest to failed:", interestError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payment_id: paymentRecord.id,
        status: paymentRecord.payment_status,
        amount: paymentRecord.amount,
        reference: paymentRecord.payment_reference,
        paid_at: paymentRecord.paid_at,
        interest_updated: interestUpdated,
        verification: verification.data,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify payment",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
