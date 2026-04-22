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

  if (profile?.role !== "creator") redirect("/dashboard");

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("bio, linkedin_url, company_name, company_website, project_type, project_description, status")
    .eq("id", user.id)
    .single();

  if (!creatorProfile) redirect("/apply/creator");

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
          bio: creatorProfile.bio,
          linkedinUrl: creatorProfile.linkedin_url,
          companyName: creatorProfile.company_name,
          companyWebsite: creatorProfile.company_website,
          projectType: creatorProfile.project_type,
          projectDescription: creatorProfile.project_description,
          status: creatorProfile.status,
        }}
      />
    </div>
  );
}
