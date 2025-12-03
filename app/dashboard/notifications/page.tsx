import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationsPanel from "@/components/notifications-panel";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select(
      `
      *,
      property_interest:property_interests(
        *,
        property:properties(*)
      ),
      kyc_submission:kyc_submissions(*),
      installment_payment:installment_payments(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto py-8">
      <NotificationsPanel initialNotifications={notifications ?? []} />
    </div>
  );
}
