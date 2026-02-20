import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminOrManager } from "@/lib/roles";
import { PropertyInterestsTable } from "@/components/property-interests-table";

// Cache for 2 minutes
export const revalidate = 120;

export default async function PropertyInterestsPage() {
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

  if (!isAdminOrManager(profile?.role)) {
    redirect("/dashboard");
  }

  // Get all property interests with related data
  const { data: propertyInterests, error: interestsError } = await supabase
    .from("property_interests")
    .select(
      `
      *,
      profiles:profiles!property_interests_user_id_fkey(
        full_name,
        email
      ),
      referring_agent:profiles!property_interests_referring_agent_id_fkey(
        full_name,
        email
      ),
      property:properties(*),
      interest_payment:interest_payments!property_interests_interest_payment_id_fkey(*)
    `,
    )
    .order("created_at", { ascending: false });

  if (interestsError) {
    console.error("Error fetching property interests:", interestsError);
  }

  // Get all unique user IDs from property interests
  const userIds = propertyInterests?.map((interest) => interest.user_id) || [];

  // Fetch KYC submissions for all users (get the most recent approved or pending KYC for each user)
  const { data: kycSubmissions } = await supabase
    .from("kyc_submissions")
    .select("*")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  // Create a map of user_id to their most recent KYC submission
  const kycMap = new Map();
  kycSubmissions?.forEach((kyc) => {
    if (!kycMap.has(kyc.user_id)) {
      kycMap.set(kyc.user_id, kyc);
    }
  });

  // Attach KYC data to property interests
  const interestsWithKYC = propertyInterests?.map((interest) => ({
    ...interest,
    kyc_submission: kycMap.get(interest.user_id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Property Interests Management</h1>
          <p className="text-muted-foreground">
            Review and manage property interest submissions from agents
          </p>
        </div>
      </div>

      <PropertyInterestsTable interests={interestsWithKYC || []} />
    </div>
  );
}
