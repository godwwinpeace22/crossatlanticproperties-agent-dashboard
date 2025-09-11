import { createClient } from "@/lib/supabase/server";
import { PaymentSubmissionForm } from "@/components/payment-submission-form";

export default async function NewSubmissionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get available properties
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, price")
    .eq("status", "available")
    .order("name");

  // Get agents who have already made payments as BUYERS (to exclude them)
  // Get agents who have uplines (are in the hierarchy as downlines)
  // Get agents who are uplines themselves (to exclude top-level agents)
  const [
    { data: existingSubmissions },
    { data: existingPurchases },
    { data: agentsInHierarchy },
    { data: uplinesInHierarchy },
  ] = await Promise.all([
    supabase.from("payment_submissions").select("buyer_id"),
    supabase.from("purchases").select("buyer_id"),
    supabase.from("agent_hierarchy").select("agent_id").eq("approved", true),
    supabase.from("agent_hierarchy").select("upline_id").eq("approved", true),
  ]);

  // Create a set of agent IDs who have already made payments as buyers
  const agentsWithPayments = new Set([
    ...(existingSubmissions?.map((s) => s.buyer_id) || []),
    ...(existingPurchases?.map((p) => p.buyer_id) || []),
  ]);

  // Create a set of agents who have uplines (are in the hierarchy as downlines)
  const agentsWithUplines = new Set(
    agentsInHierarchy?.map((h) => h.agent_id) || []
  );

  // Create a set of agents who are uplines (top-level agents - should be excluded)
  const agentsWhoAreUplines = new Set(
    uplinesInHierarchy?.map((h) => h.upline_id) || []
  );

  // Get all agents (potential buyers)
  const { data: allAgents, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "agent")
    .neq("id", user.id)
    .order("full_name");

  // Filter to include agents who:
  // 1. Have NOT made payments as buyers AND
  // 2. Are NOT top-level agents (don't appear as uplines) AND
  // 3. Either have uplines OR are completely new (not in hierarchy at all)
  const agents =
    allAgents?.filter((agent) => {
      const hasNotMadePayments = !agentsWithPayments.has(agent.id);
      const isNotTopLevel = !agentsWhoAreUplines.has(agent.id);

      // Include if: no payments AND not a top-level agent
      return hasNotMadePayments && isNotTopLevel;
    }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submit Payment</h1>
        <p className="text-muted-foreground">
          Log a payment made by a buyer to add them to your network
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No Available Agents</h3>
          <p className="text-muted-foreground mb-4">
            No agents are currently available to be selected as buyers.
          </p>
        </div>
      ) : (
        <PaymentSubmissionForm properties={properties || []} agents={agents} />
      )}
    </div>
  );
}
