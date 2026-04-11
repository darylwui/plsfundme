import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { PMApplyForm } from "@/components/auth/PMApplyForm";

export default async function ApplyPMPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → send to PM registration (creates account + applies)
  if (!user) redirect("/register?role=pm");

  // Already a PM — check their status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "project_manager") {
    const { data: pmProfile } = await supabase
      .from("project_manager_profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (pmProfile?.status === "approved") redirect("/projects/create");
    if (pmProfile?.status === "pending_review") redirect("/projects/create");
    // If rejected, fall through to let them re-apply
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[var(--color-surface-raised)]">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
              Apply as Project Manager 🚀
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1.5">
              Tell us about yourself and your campaign plan. We&apos;ll review your application within 1–2 business days.
            </p>
          </div>
          <PMApplyForm userId={user.id} />
        </div>
      </main>
    </>
  );
}
