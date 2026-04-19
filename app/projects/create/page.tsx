import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectCreationForm } from "@/components/creation/ProjectCreationForm";
import type { Category } from "@/types/project";
import { Clock, XCircle, Rocket } from "lucide-react";

export const metadata = { title: "Create a project" };

export default async function CreateProjectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/projects/create");

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Not a PM at all
  if (profile?.role !== "project_manager") {
    return (
      <main className="flex-1 bg-[var(--color-surface-raised)] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[var(--color-brand-crust)]/10 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-[var(--color-brand-crust)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-ink)]">
                Project Manager account required
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                You need a Project Manager account to launch campaigns on get that bread. Apply now — it only takes a few minutes.
              </p>
            </div>
            <Link
              href="/apply/pm"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Rocket className="w-4 h-4" />
              Apply as Project Manager
            </Link>
            <Link
              href="/"
              className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              Back to homepage
            </Link>
        </div>
      </main>
    );
  }

  // Check PM profile status
  const { data: pmProfile } = await supabase
    .from("project_manager_profiles")
    .select("status, rejection_reason")
    .eq("id", user.id)
    .single();

  // No PM profile yet, or pending review
  if (!pmProfile || pmProfile.status === "pending_review") {
    return (
      <main className="flex-1 bg-[var(--color-surface-raised)] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-ink)]">
                Application under review
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                Your Project Manager application is currently being reviewed by our team. We&apos;ll notify you within <strong>1–2 business days</strong>.
              </p>
            </div>
            <div className="w-full rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Once approved, you&apos;ll be able to create and launch your first campaign.
            </div>
            <Link
              href="/"
              className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              Back to homepage
            </Link>
        </div>
      </main>
    );
  }

  // Rejected
  if (pmProfile.status === "rejected") {
    return (
      <main className="flex-1 bg-[var(--color-surface-raised)] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-ink)]">
                Application not approved
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                Unfortunately, your Project Manager application was not approved at this time.
              </p>
            </div>
            {pmProfile.rejection_reason && (
              <div className="w-full rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-left">
                <p className="text-xs font-semibold text-red-700 mb-1">Reason</p>
                <p className="text-xs text-red-600">{pmProfile.rejection_reason}</p>
              </div>
            )}
            <Link
              href="/apply/pm"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Re-apply as Creator
            </Link>
            <a
              href="mailto:hello@getthatbread.sg"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Contact support
            </a>
            <Link
              href="/"
              className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              Back to homepage
            </Link>
        </div>
      </main>
    );
  }

  // Approved — show the creation form
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  return (
    <main className="flex-1 bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <ProjectCreationForm categories={(categories as Category[]) ?? []} />
      </div>
    </main>
  );
}
