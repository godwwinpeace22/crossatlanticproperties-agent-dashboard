/**
 * Test script for Resend email configuration
 *
 * This script helps you verify that Resend is configured correctly
 * and can send emails before deploying to production.
 *
 * Usage:
 *   npx tsx scripts/test-email.ts
 *
 * Or add to package.json:
 *   "test:email": "tsx scripts/test-email.ts"
 */

import { Resend } from "resend";

async function testResendConfiguration() {
  console.log("🧪 Testing Resend Email Configuration\n");

  // Check if API key is set
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY not found in environment variables");
    console.log("\nPlease add RESEND_API_KEY to your .env.local file:");
    console.log("RESEND_API_KEY=re_your_api_key_here\n");
    process.exit(1);
  }

  console.log("✅ RESEND_API_KEY found");
  console.log(`   Key prefix: ${apiKey.substring(0, 8)}...\n`);

  // Initialize Resend
  const resend = new Resend(apiKey);

  // Test email content
  const testEmail = {
    from: "onboarding@resend.dev", // Use Resend's testing domain
    to: "delivered@resend.dev", // Resend's test inbox
    subject: "CrossAtlanticProperties - Email Test",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 40px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #1e40af; margin-bottom: 20px;">🎉 Email Configuration Successful!</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your Resend email service is configured correctly and ready to send notifications.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              This test email confirms that:
            </p>
            <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
              <li>✅ API key is valid</li>
              <li>✅ Resend SDK is working</li>
              <li>✅ Email templates are rendering correctly</li>
            </ul>
            <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-left: 4px solid #10b981; border-radius: 4px;">
              <p style="margin: 0; color: #065f46; font-weight: 600;">Next Steps:</p>
              <ol style="color: #065f46; margin: 10px 0 0 0; padding-left: 20px;">
                <li>Run database migration: <code>021_email_notifications.sql</code></li>
                <li>Update sender domain in production</li>
                <li>Set up cron job for queue processing</li>
                <li>Test with real user notifications</li>
              </ol>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Test email from CrossAtlanticProperties MLM Dashboard
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Email Configuration Successful!

Your Resend email service is configured correctly and ready to send notifications.

This test email confirms that:
- API key is valid
- Resend SDK is working
- Email templates are rendering correctly

Next Steps:
1. Run database migration: 021_email_notifications.sql
2. Update sender domain in production
3. Set up cron job for queue processing
4. Test with real user notifications

Test email from CrossAtlanticProperties MLM Dashboard
    `.trim(),
  };

  console.log("📧 Sending test email...");
  console.log(`   From: ${testEmail.from}`);
  console.log(`   To: ${testEmail.to}`);
  console.log(`   Subject: ${testEmail.subject}\n`);

  try {
    const { data, error } = await resend.emails.send(testEmail);

    if (error) {
      console.error("❌ Failed to send test email\n");
      console.error("Error details:");
      console.error(JSON.stringify(error, null, 2));
      console.log("\nCommon issues:");
      console.log("1. Invalid API key");
      console.log("2. API key doesn't have permission to send emails");
      console.log("3. Rate limit exceeded (free tier: 100 emails/day)");
      console.log("4. Network connectivity issues\n");
      process.exit(1);
    }

    console.log("✅ Test email sent successfully!\n");
    console.log("Email details:");
    console.log(`   Email ID: ${data?.id}`);
    console.log(
      `   View in Resend dashboard: https://resend.com/emails/${data?.id}\n`
    );

    console.log("🎉 All tests passed! Your email configuration is ready.\n");
    console.log("Next steps:");
    console.log("1. Check https://resend.com/emails to see the sent email");
    console.log(
      "2. Run the database migration: scripts/021_email_notifications.sql"
    );
    console.log("3. Update the sender domain for production use");
    console.log("4. Set up a cron job to process the email queue\n");
  } catch (error) {
    console.error("❌ Unexpected error occurred\n");
    console.error(error);
    console.log("\nPlease check:");
    console.log("1. Your internet connection");
    console.log("2. Resend service status: https://resend.com/status");
    console.log("3. API key validity in Resend dashboard\n");
    process.exit(1);
  }
}

// Run the test
testResendConfiguration()
  .then(() => {
    console.log("✨ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
