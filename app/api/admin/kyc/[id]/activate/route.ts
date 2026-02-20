import { createClient } from "@/lib/supabase/server";
import { isAdminOrManager } from "@/lib/roles";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
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
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !isAdminOrManager(profile.role)) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 },
      );
    }

    // Update KYC status to approved
    const { error: updateError, data } = await supabase
      .from("profiles")
      .update({
        agent_activated: true,
      })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error approving KYC:", updateError);
      return NextResponse.json(
        { error: "Failed to approve KYC" },
        { status: 500 },
      );
    }

    // revalidatePath(`/dashboard/admin/users/${params.id}`);

    return NextResponse.json({
      success: true,
      message: "Agent successfully",
    });
  } catch (error) {
    console.error("Error approving KYC:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
