import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectReviewList } from "@/components/admin/ProjectReviewList";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminProjectsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Pending review — shown first with approval actions (all of them, no pagination)
  const { data: pendingProjects } = await supabase
    .from("projects")
    .select(
      "id, title, slug, short_description, funding_goal_sgd, amount_pledged_sgd, backer_count, deadline, created_at, cover_image_url, status, is_featured, category:categories(name), creator:profiles!creator_id(id, display_name)"
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  // Count non-draft, non-removed, non-pending projects for pagination
  const { count: totalCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .not("status", "in", "(draft,removed,pending_review)");

  // Paginated other projects
  const { data: allProjects } = await supabase
    .from("projects")
    .select(
      "id, title, slug, short_description, status, is_featured, funding_goal_sgd, amount_pledged_sgd, backer_count, created_at, deadline, cover_image_url, category:categories(name), creator:profiles!creator_id(id, display_name)"
    )
    .not("status", "in", "(draft,removed,pending_review)")
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : from + 1;
  const showingTo = Math.min(to + 1, total);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">Campaigns</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Approve or reject submitted campaigns. Remove live campaigns that violate our terms.
        </p>
      </div>
      <ProjectReviewList
        pendingProjects={(pendingProjects as any[]) ?? []}
        allProjects={(allProjects as any[]) ?? []}
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Showing {showingFrom}–{showingTo} of {total} non-pending campaigns
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/projects?page=${page - 1}`}
                className="inline-flex items-center px-4 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink-muted)] opacity-50 cursor-not-allowed">
                Previous
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={`/admin/projects?page=${page + 1}`}
                className="inline-flex items-center px-4 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink-muted)] opacity-50 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
