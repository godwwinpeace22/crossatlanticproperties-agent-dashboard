import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ApprovalsList } from "@/components/approvals-list"

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all pending submissions with details
  const { data: submissions } = await supabase
    .from("payment_submissions")
    .select(`
      *,
      properties (name, price),
      submitter:profiles!payment_submissions_submitter_id_fkey (full_name, email)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Approvals</h1>
        <p className="text-muted-foreground">Review and approve payment submissions from agents</p>
      </div>

      <ApprovalsList submissions={submissions || []} />
    </div>
  )
}
