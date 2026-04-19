import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatorProfileEditor } from "@/components/dashboard/CreatorProfileEditor";

export const metadata = { title: "Creator profile" };

export default async function CreatorProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/dashboard/creator-profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "project_manager") redirect("/dashboard");

  const { data: pmProfile } = await supabase
    .from("project_manager_profiles")
    .select("bio, linkedin_url, company_name, company_website, project_type, project_description, status")
    .eq("id", user.id)
    .single();

  if (!pmProfile) redirect("/apply/pm");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">Creator profile</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Edit the details shown in your public creator card on project pages.
        </p>
      </div>

      <CreatorProfileEditor
        userId={user.id}
        initial={{
          avatarUrl: profile?.avatar_url ?? null,
          bio: pmProfile.bio,
          linkedinUrl: pmProfile.linkedin_url,
          companyName: pmProfile.company_name,
          companyWebsite: pmProfile.company_website,
          projectType: pmProfile.project_type,
          projectDescription: pmProfile.project_description,
          status: pmProfile.status,
        }}
      />
    </div>
  );
}
