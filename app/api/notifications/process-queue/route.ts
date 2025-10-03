import { createClient } from "@/lib/supabase/server";
import {
  sendNotificationEmail,
  batchSendNotificationEmails,
} from "@/lib/email-notifications";
import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Process Email Queue
 *
 * This endpoint processes pending emails in the queue.
 * Call it periodically using a cron job or scheduler.
 *
 * GET /api/notifications/process-queue?limit=50
 *
 * Setup cron job:
 * - Vercel: Add vercel.json with cron configuration
 * - Next.js: Use external cron service (cron-job.org, EasyCron)
 * - Self-hosted: Use system cron or PM2
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get batch size from query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    // Fetch pending emails from queue
    // Note: We filter attempts < max_attempts in the application layer
    // because Supabase client doesn't support column comparison
    const { data: allQueuedEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select(
        `
        id,
        notification_id,
        to_email,
        subject,
        body_html,
        body_text,
        attempts,
        max_attempts,
        notifications!email_queue_notification_id_fkey(
          type,
          title,
          message
        )
      `
      )
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(limit * 2); // Fetch more to filter

    // Filter by attempts < max_attempts
    const queuedEmails =
      allQueuedEmails
        ?.filter((email) => email.attempts < email.max_attempts)
        .slice(0, limit) || [];

    if (fetchError) {
      throw fetchError;
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      return NextResponse.json({
        message: "No pending emails to process",
        processed: 0,
        success: 0,
        failed: 0,
      });
    }

    // Mark as sending
    const queueIds = queuedEmails.map((e) => e.id);
    await supabase
      .from("email_queue")
      .update({
        status: "sending",
        updated_at: new Date().toISOString(),
      })
      .in("id", queueIds);

    // Send emails in parallel (in batches to avoid rate limits)
    const batchSize = 10;
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < queuedEmails.length; i += batchSize) {
      const batch = queuedEmails.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (email) => {
          try {
            const notification = email.notifications as any;
            if (!notification) {
              throw new Error("Notification not found");
            }

            // Send email
            await sendNotificationEmail(email.notification_id, email.to_email, {
              title: notification.title,
              message: notification.message,
              type: notification.type,
            });

            // Mark as sent in queue
            await supabase
              .from("email_queue")
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", email.id);

            totalSuccess++;
          } catch (error) {
            // Mark as failed, increment attempts
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";

            const newAttempts = email.attempts + 1;
            const status =
              newAttempts >= email.max_attempts ? "failed" : "pending";
            const scheduledAt =
              status === "pending"
                ? new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 minutes
                : undefined;

            await supabase
              .from("email_queue")
              .update({
                status,
                attempts: newAttempts,
                last_error: errorMessage,
                scheduled_at: scheduledAt,
                updated_at: new Date().toISOString(),
              })
              .eq("id", email.id);

            totalFailed++;

            console.error(`Failed to send email ${email.id}:`, error);
          }
        })
      );
    }

    return NextResponse.json({
      message: "Email queue processed",
      processed: queuedEmails.length,
      success: totalSuccess,
      failed: totalFailed,
    });
  } catch (error) {
    console.error("Error processing email queue:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Manually trigger email queue processing
 *
 * POST /api/notifications/process-queue
 *
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Forward to GET handler
    return GET(request);
  } catch (error) {
    console.error("Error in POST process-queue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
