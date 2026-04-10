import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectCreationForm } from "@/components/creation/ProjectCreationForm";
import { Navbar } from "@/components/layout/Navbar";
import type { Category } from "@/types/project";

export default async function CreateProjectPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/projects/create");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[var(--color-surface-raised)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <ProjectCreationForm categories={(categories as Category[]) ?? []} />
        </div>
      </main>
    </>
  );
}
