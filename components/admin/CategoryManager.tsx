"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Eye, EyeOff, Pencil, GripVertical, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types/project";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSlugManual, setEditSlugManual] = useState(false);

  // Drag-and-drop state
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const supabase = createClient();

  // ── Inline edit ────────────────────────────────────────────
  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditSlugManual(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditSlugManual(false);
  }

  async function saveEdit(cat: Category) {
    if (!editName.trim() || !editSlug.trim()) return;
    setLoading(cat.id + "edit");
    await supabase
      .from("categories")
      .update({ name: editName.trim(), slug: editSlug.trim() })
      .eq("id", cat.id);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, name: editName.trim(), slug: editSlug.trim() } : c
      )
    );
    cancelEdit();
    setLoading(null);
  }

  // ── Toggle active ──────────────────────────────────────────
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

  // ── Delete ─────────────────────────────────────────────────
  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Projects using it will need to be updated.")) return;
    setLoading(id);
    await supabase.from("categories").delete().eq("id", id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setLoading(null);
  }

  // ── Add ────────────────────────────────────────────────────
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

  // ── Drag-to-reorder ────────────────────────────────────────
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    setDragOverIndex(index);
    // Reorder locally
    setCategories((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(index, 0, moved);
      dragIndex.current = index;
      return next;
    });
  }

  async function handleDrop() {
    setDragOverIndex(null);
    dragIndex.current = null;
    // Persist new order
    const updates = categories.map((cat, i) => ({ id: cat.id, display_order: i + 1 }));
    await Promise.all(
      updates.map(({ id, display_order }) =>
        supabase.from("categories").update({ display_order }).eq("id", id)
      )
    );
    setCategories((prev) => prev.map((c, i) => ({ ...c, display_order: i + 1 })));
  }

  function handleDragEnd() {
    setDragOverIndex(null);
    dragIndex.current = null;
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat, index) => {
        const isEditing = editingId === cat.id;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 flex items-center gap-3 transition-all ${
              !cat.is_active && !isEditing ? "opacity-50" : ""
            } ${isDragOver ? "ring-2 ring-[var(--color-brand-violet)]/40 border-[var(--color-brand-violet)]/30" : ""}`}
          >
            {/* Drag handle */}
            <div className="cursor-grab active:cursor-grabbing text-[var(--color-ink-subtle)] shrink-0">
              <GripVertical className="w-4 h-4" />
            </div>

            {isEditing ? (
              /* ── Inline edit form ── */
              <div className="flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Name"
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      if (!editSlugManual) {
                        setEditSlug(toSlug(e.target.value));
                      }
                    }}
                  />
                  <Input
                    label="Slug"
                    value={editSlug}
                    onChange={(e) => {
                      setEditSlug(e.target.value);
                      setEditSlugManual(true);
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={loading === cat.id + "edit"}
                    onClick={() => saveEdit(cat)}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Normal row ── */
              <>
                <div className="flex-1">
                  <p className="font-bold text-[var(--color-ink)]">{cat.name}</p>
                  <p className="text-xs text-[var(--color-ink-subtle)]">/{cat.slug}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(cat)}
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
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
              </>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-[var(--color-brand-violet)]/30 p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              placeholder="Technology"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(toSlug(e.target.value));
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
