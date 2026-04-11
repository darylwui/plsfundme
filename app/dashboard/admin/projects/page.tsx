import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectReviewList } from "@/components/admin/ProjectReviewList";

export default async function DashboardAdminProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  // Pending review — shown first with approval actions
  const { data: pendingProjects } = await supabase
    .from("projects")
    .select(
      "id, title, slug, short_description, funding_goal_sgd, amount_pledged_sgd, backer_count, deadline, created_at, cover_image_url, status, category:categories(name), creator:profiles!creator_id(id, display_name)"
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  // All other non-draft, non-removed projects
  const { data: allProjects } = await supabase
    .from("projects")
    .select(
      "id, title, slug, short_description, status, funding_goal_sgd, amount_pledged_sgd, backer_count, created_at, deadline, cover_image_url, category:categories(name), creator:profiles!creator_id(id, display_name)"
    )
    .not("status", "in", "(draft,removed)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">Review campaigns</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Approve or reject submitted campaigns. Remove live campaigns that violate our terms.
        </p>
      </div>
      <ProjectReviewList
        pendingProjects={(pendingProjects as any[]) ?? []}
        allProjects={(allProjects as any[]) ?? []}
      />
    </div>
  );
}
