import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PMApplyLanding } from "@/components/auth/PMApplyLanding";

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
    <div className="bg-[var(--color-surface-raised)]">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <PMApplyLanding userId={user.id} />
      </div>
    </div>
  );
}
