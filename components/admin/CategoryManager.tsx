"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types/project";

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const supabase = createClient();

  async function toggleActive(cat: Category) {
    setLoading(cat.id);
    await supabase
      .from("categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
    );
    setLoading(null);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Projects using it will need to be updated.")) return;
    setLoading(id);
    await supabase.from("categories").delete().eq("id", id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setLoading(null);
  }

  async function addCategory() {
    if (!newName.trim() || !newSlug.trim()) return;
    setLoading("new");
    const { data } = await supabase
      .from("categories")
      .insert({
        name: newName.trim(),
        slug: newSlug.trim(),
        display_order: categories.length + 1,
      })
      .select()
      .single();
    if (data) setCategories((prev) => [...prev, data as Category]);
    setNewName("");
    setNewSlug("");
    setAdding(false);
    setLoading(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className={`bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 flex items-center gap-4 ${
            !cat.is_active ? "opacity-50" : ""
          }`}
        >
          <div className="flex-1">
            <p className="font-bold text-[var(--color-ink)]">{cat.name}</p>
            <p className="text-xs text-[var(--color-ink-subtle)]">/{cat.slug}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              loading={loading === cat.id}
              onClick={() => toggleActive(cat)}
              title={cat.is_active ? "Hide" : "Show"}
            >
              {cat.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={loading === cat.id}
              onClick={() => deleteCategory(cat.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-[var(--color-brand-violet)]/30 p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              placeholder="Technology"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
              }}
            />
            <Input
              label="Slug"
              placeholder="technology"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
            <Button loading={loading === "new"} onClick={addCategory}>Add category</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-violet)]/50 p-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-brand-violet)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Add category
        </button>
      )}
    </div>
  );
}
