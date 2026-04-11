import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PMApprovalList } from "@/components/admin/PMApprovalList";

interface PMProfile {
  id: string;
  bio: string;
  linkedin_url: string | null;
  company_name: string | null;
  company_website: string | null;
  project_type: string;
  project_description: string;
  id_document_url: string | null;
  singpass_verified: boolean;
  status: "pending_review" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  email?: string;
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectManagersPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;

  // Verify admin access
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!adminProfile?.is_admin) redirect("/");

  // Fetch PM profiles with service client
  const service = createServiceClient();

  const { data: pmProfiles } = await service
    .from("project_manager_profiles")
    .select("*, profile:profiles(display_name, avatar_url)")
    .order("submitted_at", { ascending: true });

  // Fetch emails from auth
  const {
    data: { users },
  } = await service.auth.admin.listUsers();

  const emailMap = new Map(users.map((u) => [u.id, u.email ?? ""]));

  const enriched: PMProfile[] = (pmProfiles ?? []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? "",
  }));

  const activeTab = (tab === "approved" || tab === "rejected") ? tab : "pending_review";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Project Manager Applications</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Review and approve applications from aspiring campaign creators.
        </p>
      </div>

      {/* Tab counts */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {(["pending_review", "approved", "rejected"] as const).map((t) => {
          const count = enriched.filter((p) => p.status === t).length;
          const isActive = activeTab === t;
          const label = t === "pending_review" ? "Pending Review" : t === "approved" ? "Approved" : "Rejected";
          return (
            <a
              key={t}
              href={`/admin/project-managers?tab=${t}`}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                isActive
                  ? "border-[var(--color-brand-violet)] text-[var(--color-ink)]"
                  : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[var(--color-brand-violet)] text-white"
                      : "bg-[var(--color-border)] text-[var(--color-ink-muted)]"
                  }`}
                >
                  {count}
                </span>
              )}
            </a>
          );
        })}
      </div>

      <PMApprovalList pmProfiles={enriched} activeTab={activeTab} />
    </div>
  );
}
