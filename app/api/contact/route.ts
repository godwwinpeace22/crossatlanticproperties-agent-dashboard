import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactPayload = {
  formType: "contact" | "support";
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  interest?: string;
  message?: string;
  category?: string;
  subject?: string;
  details?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 },
      );
    }

    const data = (await request.json()) as ContactPayload;

    if (!data?.formType || !data?.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const to =
      data.formType === "support"
        ? ["support@crossatlanticproperties.com"]
        : ["info@crossatlanticproperties.com"];

    const from =
      process.env.RESEND_FROM_EMAIL ||
      "Crossatlantic Properties <noreply@crossatlanticproperties.com>";

    let subject = "";
    let text = "";
    let html = "";

    if (data.formType === "contact") {
      if (
        !data.firstName ||
        !data.lastName ||
        !data.interest ||
        !data.message
      ) {
        return NextResponse.json(
          { error: "Missing required contact fields" },
          { status: 400 },
        );
      }

      subject = `Contact Form - ${data.interest}`;
      text = `New Contact Form Submission\n\nName: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nPhone: ${data.phone || "Not provided"}\nInterest: ${data.interest}\n\nMessage:\n${data.message}`;
      html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone || "Not provided"}</p>
        <p><strong>Interest:</strong> ${data.interest}</p>
        <p><strong>Message:</strong></p>
        <p>${(data.message || "").replace(/\n/g, "<br />")}</p>
      `;
    } else {
      if (!data.category || !data.subject || !data.details) {
        return NextResponse.json(
          { error: "Missing required support fields" },
          { status: 400 },
        );
      }

      subject = `Support Request - ${data.category}: ${data.subject}`;
      text = `New Support Request\n\nFrom: ${data.email}\nCategory: ${data.category}\nSubject: ${data.subject}\n\nDetails:\n${data.details}`;
      html = `
        <h2>New Support Request</h2>
        <p><strong>From:</strong> ${data.email}</p>
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Details:</strong></p>
        <p>${(data.details || "").replace(/\n/g, "<br />")}</p>
      `;
    }

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from,
      to,
      replyTo: data.email,
      subject,
      text,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      id: emailResult?.id,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
