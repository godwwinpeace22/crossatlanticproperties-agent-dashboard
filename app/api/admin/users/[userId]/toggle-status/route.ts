import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    // Get current user status
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", params.userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Toggle status
    const newStatus = targetUser.status === "active" ? "suspended" : "active";

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", params.userId);

    if (updateError) {
      console.error("Error updating user status:", updateError);
      return NextResponse.json(
        { error: "Failed to update user status" },
        { status: 500 }
      );
    }

    // Revalidate the user page
    revalidatePath(`/dashboard/admin/users/${params.userId}`);

    return NextResponse.json({
      success: true,
      message: `User ${
        newStatus === "active" ? "activated" : "deactivated"
      } successfully`,
      newStatus,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
