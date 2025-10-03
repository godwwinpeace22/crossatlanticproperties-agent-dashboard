import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  initializePayment,
  generatePaymentReference,
  nairaToKobo,
} from "@/lib/paystack";

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { property_id, property_name, callback_url, payment_plan } = body;

    if (!property_id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    // Check if user already has an interest for this property
    const { data: existingInterest } = await supabase
      .from("property_interests")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("property_id", property_id)
      .single();

    if (existingInterest) {
      return NextResponse.json(
        {
          error: "You have already submitted interest for this property",
          details: {
            interest_id: existingInterest.id,
            status: existingInterest.status,
          },
        },
        { status: 409 } // Conflict
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const email = profile?.email || user.email || "";

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Generate payment reference
    const reference = generatePaymentReference("INT");

    // Application fee is 10,000 Naira
    const amountInNaira = 10000;
    const amountInKobo = nairaToKobo(amountInNaira);

    // Initialize Paystack payment
    const paymentResponse = await initializePayment({
      email,
      amount: amountInKobo,
      reference,
      currency: "NGN",
      metadata: {
        user_id: user.id,
        property_id,
        property_name,
        full_name: profile?.full_name || "",
        payment_type: "interest_application_fee",
      },
      callback_url:
        callback_url ||
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?reference=${reference}`,
    });

    // Create payment record in database
    const { data: paymentRecord, error: dbError } = await supabase
      .from("interest_payments")
      .insert({
        user_id: user.id,
        property_id,
        amount: amountInNaira,
        currency: "NGN",
        payment_reference: reference,
        payment_status: "pending",
        payment_plan: payment_plan || null,
        paystack_response: paymentResponse,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating payment record:", dbError);
      return NextResponse.json(
        { error: "Failed to create payment record", details: dbError.message },
        { status: 500 }
      );
    }

    console.log("Payment record created successfully:", {
      payment_id: paymentRecord.id,
      reference: paymentRecord.payment_reference,
      user_id: user.id,
    });

    // Create property interest with payment_pending status
    const { data: interestRecord, error: interestError } = await supabase
      .from("property_interests")
      .insert({
        user_id: user.id,
        property_id,
        selected_payment_plan: payment_plan || "full",
        interest_payment_id: paymentRecord.id,
        status: "payment_pending",
      })
      .select()
      .single();

    if (interestError) {
      console.error("Error creating property interest:", interestError);
      // Roll back payment record if interest creation fails
      await supabase
        .from("interest_payments")
        .delete()
        .eq("id", paymentRecord.id);

      return NextResponse.json(
        {
          error: "Failed to create interest record",
          details: interestError.message,
        },
        { status: 500 }
      );
    }

    console.log("Property interest created with payment_pending status:", {
      interest_id: interestRecord.id,
      payment_id: paymentRecord.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: paymentResponse.data.authorization_url,
        access_code: paymentResponse.data.access_code,
        reference: paymentResponse.data.reference,
        payment_id: paymentRecord.id,
      },
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize payment",
      },
      { status: 500 }
    );
  }
}
