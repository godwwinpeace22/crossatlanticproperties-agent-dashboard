import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KYCApprovalsList } from "@/components/kyc-approvals-list";

export default async function KYCApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get all KYC submissions with user details
  const { data: kycSubmissions, error } = await supabase
    .from("kyc_submissions")
    .select(
      `
      *,
      profiles!kyc_submissions_user_id_fkey(
        full_name,
        email
      ),
      reviewer:profiles!kyc_submissions_reviewed_by_fkey(
        full_name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  console.log({ data: kycSubmissions, error, profile });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">KYC Approvals</h1>
          <p className="text-muted-foreground">
            Review and manage Know Your Customer verification submissions
          </p>
        </div>
      </div>

      <KYCApprovalsList submissions={kycSubmissions || []} />
    </div>
  );
}
