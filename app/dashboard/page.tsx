import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookmarkDashboard from "./BookmarkDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch initial bookmarks server-side
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <BookmarkDashboard
      user={user}
      initialBookmarks={bookmarks || []}
    />
  );
}
