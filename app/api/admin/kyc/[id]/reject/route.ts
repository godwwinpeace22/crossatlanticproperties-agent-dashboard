import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Parse request body for rejection reason (optional)
    const { reason } = await request.json().catch(() => ({}));

    // Update KYC status to rejected
    const { error: updateError } = await supabase
      .from("kyc_submissions")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: reason || "KYC documents did not meet requirements",
      })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error rejecting KYC:", updateError);
      return NextResponse.json(
        { error: "Failed to reject KYC" },
        { status: 500 }
      );
    }

    // Get the KYC submission to find the user and revalidate their page
    const { data: kycSubmission } = await supabase
      .from("kyc_submissions")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (kycSubmission) {
      revalidatePath(`/dashboard/admin/users/${kycSubmission.user_id}`);
    }

    return NextResponse.json({
      success: true,
      message: "KYC rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
