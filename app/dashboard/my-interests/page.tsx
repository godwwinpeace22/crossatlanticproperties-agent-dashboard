import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyInterests } from "@/components/my-interests";

// Cache for 1 minute (payment data changes frequently)
export const revalidate = 60;

export default async function MyPaymentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user?.user_metadata?.role === "admin") {
    redirect("/dashboard/admin");
  }

  // Get user's installment payments with property interest details
  const { data: installmentPayments } = await supabase
    .from("installment_payments")
    .select(
      `
      *,
      property_interest:property_interests(
        *,
        property:properties(*)
      )
    `,
    )
    .eq("property_interest.user_id", user.id)
    .order("due_date", { ascending: true });

  const { data: interests } = await supabase
    .from("property_interests")
    .select(
      `
    *,
    property:properties(*)
  `,
    )
    .eq("user_id", user?.id);

  // console.log({ installmentPayments, interests, user });

  return (
    <MyInterests
      payments={installmentPayments || []}
      interests={interests || []}
    />
  );
}
