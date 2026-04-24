import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageCircleQuestion,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ApplicationThread } from "@/components/dashboard/ApplicationThread";

export const metadata = { title: "Your application — get that bread" };

type CreatorStatus = "pending_review" | "approved" | "rejected" | "needs_info";

const STATUS_META: Record<
  CreatorStatus,
  { label: string; className: string; Icon: typeof Clock; blurb: string }
> = {
  pending_review: {
    label: "Under review",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    Icon: Clock,
    blurb:
      "Our team is reviewing your application. You'll get an email when there's an update — usually within 1–2 business days.",
  },
  needs_info: {
    label: "Needs info",
    className: "bg-blue-50 text-blue-800 border-blue-200",
    Icon: MessageCircleQuestion,
    blurb:
      "A reviewer has asked a follow-up question below. Reply here to keep your application moving.",
  },
  approved: {
    label: "Approved",
    className: "bg-green-50 text-green-800 border-green-200",
    Icon: CheckCircle,
    blurb: "You're approved as a creator. You can launch your first campaign from your dashboard.",
  },
  rejected: {
    label: "Not approved",
    className: "bg-red-50 text-red-800 border-red-200",
    Icon: XCircle,
    blurb: "Your application was not approved. You can re-apply after addressing the feedback below.",
  },
};

export default async function ApplicationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/dashboard/application");

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select(
      "id, bio, project_type, project_description, status, rejection_reason, submitted_at, info_requested_at, reviewed_at"
    )
    .eq("id", user.id)
    .single();

  if (!creatorProfile) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
          <h1 className="text-lg font-bold text-[var(--color-ink)]">
            You haven&apos;t applied as a creator yet
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-2">
            Submit an application to launch your first campaign.
          </p>
          <Link
            href="/apply/creator"
            className="inline-block mt-4 px-4 py-2 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white text-sm font-semibold"
          >
            Apply as Creator
          </Link>
        </div>
      </div>
    );
  }

  const status = creatorProfile.status as CreatorStatus;
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  const canReply = status === "needs_info" || status === "pending_review";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
        <h1 className="text-2xl font-black text-[var(--color-ink)] mt-3">Your application</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Status, reviewer messages, and follow-ups.
        </p>
      </div>

      {/* Status banner */}
      <div className={`rounded-[var(--radius-card)] border px-5 py-4 flex gap-3 ${meta.className}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold">{meta.label}</p>
          <p className="text-sm mt-0.5 leading-relaxed">{meta.blurb}</p>
          {status === "rejected" && creatorProfile.rejection_reason && (
            <div className="mt-3 rounded-[var(--radius-btn)] bg-white/60 px-3 py-2 text-sm whitespace-pre-wrap">
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                Feedback from reviewer
              </p>
              {creatorProfile.rejection_reason}
            </div>
          )}
        </div>
      </div>

      {/* Application summary */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink-subtle)]">
          What you submitted
        </h2>
        <div>
          <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide mb-1">
            Bio
          </p>
          <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">
            {creatorProfile.bio}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
              Campaign
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-brand-crust)]/10 text-[var(--color-brand-crust)] font-medium">
              {creatorProfile.project_type}
            </span>
          </div>
          <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">
            {creatorProfile.project_description}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink-subtle)] mb-4">
          Messages with reviewer
        </h2>
        <ApplicationThread currentUserId={user.id} canReply={canReply} />
      </div>
    </div>
  );
}
