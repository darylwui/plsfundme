"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
}

export function ImageUpload({ value, onChange, label = "Cover image", hint }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Upload failed.");
    } else {
      onChange(json.url);
    }
    setLoading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[var(--color-ink)]">{label}</label>
      )}

      {value ? (
        <div className="relative rounded-[var(--radius-card)] overflow-hidden aspect-video bg-[var(--color-surface-overlay)] group">
          <Image src={value} alt="Cover" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-violet)]/50 aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors hover:bg-[var(--color-surface-overlay)]"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 text-[var(--color-brand-violet)] animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center">
                <Upload className="w-5 h-5 text-[var(--color-ink-muted)]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  Drop an image or click to upload
                </p>
                <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">
                  JPEG, PNG, WebP up to 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-xs text-[var(--color-brand-coral)]">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--color-ink-subtle)]">{hint}</p>}
    </div>
  );
}
