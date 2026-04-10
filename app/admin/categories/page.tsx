import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">Categories</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Manage project categories shown to creators and backers.
        </p>
      </div>
      <CategoryManager categories={categories ?? []} />
    </div>
  );
}
