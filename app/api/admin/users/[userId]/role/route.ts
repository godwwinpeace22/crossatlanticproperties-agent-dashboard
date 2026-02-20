import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/roles";

const ALLOWED_ROLES = ["admin", "manager", "staff", "agent", "buyer"] as const;

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const supabase = await createClient();

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

    if (profileError || !profile || !isAdminRole(profile.role)) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { role } = body as { role?: string };

    if (
      !role ||
      !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])
    ) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (params.userId === user.id && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot change your own admin role" },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", params.userId);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
