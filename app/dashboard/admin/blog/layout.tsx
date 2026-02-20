import type React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminOrManager } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!profile || !isAdminOrManager(profile.role)) {
    // Redirect non-admin users to their dashboard
    redirect("/dashboard");
  }

  return <>{children}</>;
}
