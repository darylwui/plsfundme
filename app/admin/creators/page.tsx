import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CreatorApprovalList } from "@/components/admin/CreatorApprovalList";

type CreatorStatus = "pending_review" | "approved" | "rejected" | "needs_info";

interface CreatorProfile {
  id: string;
  bio: string;
  linkedin_url: string | null;
  company_name: string | null;
  company_website: string | null;
  project_type: string;
  project_description: string;
  id_document_url: string | null;
  singpass_verified: boolean;
  status: CreatorStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  info_requested_at: string | null;
  last_contacted_at: string | null;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  email?: string;
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export const metadata = { title: "Creators — Admin" };

const TAB_ORDER: CreatorStatus[] = ["pending_review", "needs_info", "approved", "rejected"];
const TAB_LABELS: Record<CreatorStatus, string> = {
  pending_review: "Pending Review",
  needs_info: "Needs Info",
  approved: "Approved",
  rejected: "Rejected",
};

function isCreatorStatus(v: string | undefined): v is CreatorStatus {
  return v === "pending_review" || v === "needs_info" || v === "approved" || v === "rejected";
}

export default async function CreatorsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;

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

  const service = createServiceClient();

  const { data: pmRaw } = await service
    .from("creator_profiles")
    .select("*")
    .order("submitted_at", { ascending: true });

  const { data: profileRows } = await service
    .from("profiles")
    .select("id, display_name, avatar_url");

  const profileMap = new Map(
    (profileRows ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
  );

  const {
    data: { users },
  } = await service.auth.admin.listUsers();

  const emailMap = new Map(users.map((u) => [u.id, u.email ?? ""]));

  const enriched: CreatorProfile[] = (pmRaw ?? []).map((p) => ({
    ...p,
    profile: profileMap.get(p.id) ?? null,
    email: emailMap.get(p.id) ?? "",
  }));

  const activeTab: CreatorStatus = isCreatorStatus(tab) ? tab : "pending_review";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Creator Applications</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Review, message, and approve applications from aspiring campaign creators.
        </p>
      </div>

      <div className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto">
        {TAB_ORDER.map((t) => {
          const count = enriched.filter((p) => p.status === t).length;
          const isActive = activeTab === t;
          return (
            <a
              key={t}
              href={`/admin/creators?tab=${t}`}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-[var(--color-brand-crust)] text-[var(--color-ink)]"
                  : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {TAB_LABELS[t]}
              {count > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[var(--color-brand-crust)] text-white"
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

      <CreatorApprovalList creatorProfiles={enriched} activeTab={activeTab} />
    </div>
  );
}
