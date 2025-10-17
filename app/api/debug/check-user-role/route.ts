import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: "Not authenticated",
        user: null,
        profile: null,
      });
    }

    // Get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      isAdmin: profile?.role === "admin",
    });
  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
