import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, role, temporaryPassword } = body;

    // Validate required fields
    if (!email || !fullName || !role || !temporaryPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current user to verify admin permissions
    const supabase = await createClient();
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

    // Check if current user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log("Current user profile check:", {
      userId: user.id,
      profile,
      profileError: profileError?.message,
    });

    if (profileError) {
      return NextResponse.json(
        { 
          error: "Failed to verify user role", 
          details: profileError.message,
          userId: user.id 
        },
        { status: 500 }
      );
    }

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { 
          error: "Admin privileges required", 
          currentRole: profile?.role || "no profile found",
          userId: user.id 
        },
        { status: 403 }
      );
    }

    // Create user with service role client
    const adminSupabase = createServiceClient();

    console.log("Attempting to create user with:", {
      email,
      fullName,
      role,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    const { data: authUser, error: createUserError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true, // Auto-confirm email for admin-created accounts
        user_metadata: {
          full_name: fullName,
          role,
          created_by_admin: true,
        },
      });

    if (createUserError) {
      console.error("Error creating user:", {
        error: createUserError,
        message: createUserError.message,
        code: createUserError.code,
      });
      return NextResponse.json(
        { 
          error: "Database error creating new user",
          details: createUserError.message,
          code: createUserError.code,
        },
        { status: 400 }
      );
    }

    console.log("User created successfully, creating profile for:", authUser.user.id);

    // Create or update profile
    const { error: profileInsertError } = await adminSupabase
      .from("profiles")
      .insert({
        id: authUser.user.id,
        email,
        full_name: fullName,
        role,
        status: "active",
      });

    if (profileInsertError) {
      console.error("Profile insert error:", profileInsertError);
      // If profile creation fails, try to update instead (in case it was auto-created)
      const { error: updateError } = await adminSupabase
        .from("profiles")
        .update({
          full_name: fullName,
          role,
          status: "active",
        })
        .eq("id", authUser.user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return NextResponse.json(
          { 
            error: "Failed to create user profile",
            insertError: profileInsertError.message,
            updateError: updateError.message,
          },
          { status: 500 }
        );
      } else {
        console.log("Profile updated successfully after insert failed");
      }
    } else {
      console.log("Profile created successfully");
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        full_name: fullName,
        role,
      },
    });
  } catch (error) {
    console.error("Error in create-user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}