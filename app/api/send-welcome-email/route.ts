import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailData {
  email: string;
  fullName: string;
  role: string;
  temporaryPassword: string;
  welcomeMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const data: WelcomeEmailData = await request.json();
    const { email, fullName, role, temporaryPassword, welcomeMessage } = data;

    // Create email content
    const defaultMessage = `Welcome to Crossatlantic Properties! Your account has been created as a ${role}.`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Crossatlantic Properties</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Crossatlantic Properties</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hello ${fullName}!</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${welcomeMessage || defaultMessage}
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Your Login Credentials</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
              <p><strong>Role:</strong> <span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; text-transform: capitalize;">${role}</span></p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Important:</strong> Please change your password after your first login for security purposes.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Access Your Account
              </a>
            </div>
            
            <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
              <h4 style="color: #495057;">What's Next?</h4>
              <ul style="color: #6c757d;">
                <li>Log in to your account using the credentials above</li>
                <li>Complete your profile setup</li>
                <li>Change your temporary password</li>
                ${
                  role === "agent"
                    ? "<li>Set up your referral links and commission tracking</li>"
                    : ""
                }
                ${
                  role === "buyer"
                    ? "<li>Browse available properties and submit interests</li>"
                    : ""
                }
                ${
                  role === "staff"
                    ? "<li>Access your assigned administrative tasks</li>"
                    : ""
                }
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
              <p>Need help? Contact our support team at 
                <a href="mailto:support@crossatlanticproperties.com" style="color: #007bff;">
                  support@crossatlanticproperties.com
                </a>
              </p>
              <p style="margin-top: 15px;">
                © 2024 Crossatlantic Properties. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Welcome to Crossatlantic Properties!

Hello ${fullName},

${welcomeMessage || defaultMessage}

Your Login Credentials:
- Email: ${email}
- Temporary Password: ${temporaryPassword}
- Role: ${role}

Important: Please change your password after your first login for security purposes.

Login here: ${process.env.NEXT_PUBLIC_SITE_URL}/login

Need help? Contact us at support@crossatlanticproperties.com

© 2024 Crossatlantic Properties. All rights reserved.
    `;

    // Send email using Resend
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: "Crossatlantic Properties <noreply@crossatlanticproperties.com>",
      to: [email],
      subject: `Welcome to Crossatlantic Properties - Your ${role} account is ready`,
      html: emailHtml,
      text: emailText,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: emailResult?.id,
      message: "Welcome email sent successfully",
    });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
