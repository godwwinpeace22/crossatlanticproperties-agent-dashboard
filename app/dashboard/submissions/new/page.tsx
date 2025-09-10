import { createClient } from "@/lib/supabase/server"
import { PaymentSubmissionForm } from "@/components/payment-submission-form"

export default async function NewSubmissionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Get available properties
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, price")
    .eq("status", "available")
    .order("name")

  // Get all agents (potential buyers)
  const { data: agents } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "agent")
    .neq("id", user.id)
    .order("full_name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submit Payment</h1>
        <p className="text-muted-foreground">Log a payment made by a buyer to add them to your network</p>
      </div>

      <PaymentSubmissionForm properties={properties || []} agents={agents || []} />
    </div>
  )
}
