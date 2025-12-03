import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    const validIds = Array.isArray(ids)
      ? ids.filter((id) => typeof id === "string" && id.length > 0)
      : [];

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "No notification IDs provided" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .in("id", validIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to update notifications" },
      { status: 500 }
    );
  }
}
