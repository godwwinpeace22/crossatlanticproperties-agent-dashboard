import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email-notifications";
import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Send notification email
 *
 * This endpoint can be called by:
 * 1. Database triggers (via webhook)
 * 2. Background jobs
 * 3. Manual retry operations
 *
 * POST /api/notifications/send-email
 * Body: { notificationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication (optional - remove if called by webhooks)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse request body
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId is required" },
        { status: 400 }
      );
    }

    // Fetch notification details
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select(
        `
        id,
        user_id,
        type,
        title,
        message,
        email_sent,
        profiles!notifications_user_id_fkey(email)
      `
      )
      .eq("id", notificationId)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Check if email already sent
    if (notification.email_sent) {
      return NextResponse.json(
        { message: "Email already sent" },
        { status: 200 }
      );
    }

    // Get user email
    const userEmail = (notification.profiles as any)?.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 404 }
      );
    }

    // Send email
    await sendNotificationEmail(notification.id, userEmail, {
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in send-email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Batch send emails for unsent notifications
 *
 * GET /api/notifications/send-email?batch=true&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if batch mode
    const searchParams = request.nextUrl.searchParams;
    const batch = searchParams.get("batch") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!batch) {
      return NextResponse.json(
        { error: "Use POST for single email sending" },
        { status: 400 }
      );
    }

    // Fetch unsent notifications
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(
        `
        id,
        type,
        title,
        message,
        profiles!notifications_user_id_fkey(email)
      `
      )
      .eq("email_sent", false)
      .is("email_error", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json(
        { message: "No unsent notifications found" },
        { status: 200 }
      );
    }

    // Send emails in parallel
    const results = await Promise.allSettled(
      notifications.map(async (notification) => {
        const userEmail = (notification.profiles as any)?.email;
        if (!userEmail) return;

        await sendNotificationEmail(notification.id, userEmail, {
          title: notification.title,
          message: notification.message,
          type: notification.type,
        });
      })
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      message: "Batch email sending completed",
      total: notifications.length,
      success: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error("Error in batch send-email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
