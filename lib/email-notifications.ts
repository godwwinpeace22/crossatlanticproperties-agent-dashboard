/**
 * Email Notification Service
 *
 * This module handles sending email notifications to users.
 * Configure your email service provider (Resend, SendGrid, AWS SES, etc.)
 *
 * Setup Instructions:
 * 1. Install email package: npm install resend (or your preferred provider)
 * 2. Add API key to .env.local: RESEND_API_KEY=your_api_key
 * 3. Update the sendEmail function with your provider's implementation
 */

import { createClient } from "@/lib/supabase/server";

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email notification using Resend
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
}: EmailNotification): Promise<boolean> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured. Email will not be sent.");
      console.log("📧 EMAIL NOTIFICATION (NOT SENT):", {
        to,
        subject,
        html: html.substring(0, 100) + "...",
      });
      return false;
    }

    // Using Resend
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "CrossAtlanticProperties <noreply@crossatlanticproperties.com>", //onboarding@resend.dev
      to: [to],
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log("✅ Email sent successfully via Resend:", data?.id);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Generate HTML email template
 */
function generateEmailTemplate(notification: {
  title: string;
  message: string;
  type: string;
  ctaUrl?: string;
  ctaText?: string;
}): string {
  const { title, message, type, ctaUrl, ctaText } = notification;

  // Color scheme based on notification type
  const colors = {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    default: "#1e40af",
  };

  const color =
    type.includes("approved") ||
    type.includes("complete") ||
    type.includes("earned")
      ? colors.success
      : type.includes("rejected")
      ? colors.error
      : type.includes("payment") || type.includes("reminder")
      ? colors.warning
      : colors.info;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: ${color}; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                      CrossAtlanticProperties
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">
                      ${title}
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      ${message}
                    </p>
                    
                    ${
                      ctaUrl && ctaText
                        ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${ctaUrl}" style="display: inline-block; padding: 12px 30px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                              ${ctaText}
                            </a>
                          </td>
                        </tr>
                      </table>
                    `
                        : ""
                    }
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      This is an automated notification from CrossAtlanticProperties
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} CrossAtlanticProperties. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Generate plain text version of email
 */
function generateTextVersion(notification: {
  title: string;
  message: string;
  ctaUrl?: string;
}): string {
  const { title, message, ctaUrl } = notification;

  return `
CrossAtlanticProperties Notification

${title}

${message}

${ctaUrl ? `View Details: ${ctaUrl}` : ""}

---
This is an automated notification from CrossAtlanticProperties
© ${new Date().getFullYear()} CrossAtlanticProperties. All rights reserved.
  `.trim();
}

/**
 * Send notification email to a user
 */
export async function sendNotificationEmail(
  notificationId: string,
  userEmail: string,
  notification: {
    title: string;
    message: string;
    type: string;
  }
): Promise<void> {
  try {
    const supabase = await createClient();

    // Generate CTA based on notification type
    let ctaUrl: string | undefined;
    let ctaText: string | undefined;

    if (notification.type.includes("interest")) {
      ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-interests`;
      ctaText = "View Property Interests";
    } else if (notification.type.includes("payment")) {
      ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-interests`;
      ctaText = "View Payments";
    } else if (notification.type.includes("commission")) {
      ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/commissions`;
      ctaText = "View Commissions";
    } else if (notification.type.includes("kyc")) {
      ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc`;
      ctaText = "View KYC Status";
    }

    // Generate email content
    const html = generateEmailTemplate({
      ...notification,
      ctaUrl,
      ctaText,
    });

    const text = generateTextVersion({
      ...notification,
      ctaUrl,
    });

    // Send email
    const emailSent = await sendEmail({
      to: userEmail,
      subject: notification.title,
      html,
      text,
    });

    // Update notification record
    await supabase
      .from("notifications")
      .update({
        email_sent: emailSent,
        email_sent_at: emailSent ? new Date().toISOString() : null,
        email_error: emailSent ? null : "Failed to send email",
      })
      .eq("id", notificationId);
  } catch (error) {
    console.error("Error in sendNotificationEmail:", error);

    // Update notification with error
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .update({
        email_sent: false,
        email_error: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", notificationId);
  }
}

/**
 * Batch send emails for multiple notifications
 */
export async function batchSendNotificationEmails(
  notifications: Array<{
    id: string;
    email: string;
    title: string;
    message: string;
    type: string;
  }>
): Promise<void> {
  const results = await Promise.allSettled(
    notifications.map(({ id, email, ...notification }) =>
      sendNotificationEmail(id, email, notification)
    )
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`Failed to send ${failed.length} notification emails`);
  }
}
