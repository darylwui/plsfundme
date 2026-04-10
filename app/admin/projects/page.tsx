import { createClient } from "@/lib/supabase/server";
import { ProjectReviewList } from "@/components/admin/ProjectReviewList";

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  // Fetch pending_review projects with creator info
  const { data: pendingProjects } = await supabase
    .from("projects")
    .select(
      "id, title, slug, short_description, funding_goal_sgd, deadline, created_at, cover_image_url, category:categories(name), creator:profiles!creator_id(id, display_name)"
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  // Fetch all non-draft, non-removed projects for the "All campaigns" tab
  const { data: allProjects } = await supabase
    .from("projects")
    .select(
      "id, title, slug, status, funding_goal_sgd, amount_pledged_sgd, backer_count, created_at, cover_image_url, category:categories(name), creator:profiles!creator_id(id, display_name)"
    )
    .not("status", "in", '("draft","removed")')
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">Projects</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Review submitted campaigns and manage live projects.
        </p>
      </div>
      <ProjectReviewList
        pendingProjects={(pendingProjects as any[]) ?? []}
        allProjects={(allProjects as any[]) ?? []}
      />
    </div>
  );
}
