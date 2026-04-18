"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  /** compact = square thumbnail style, for reward images */
  compact?: boolean;
}

export function ImageUpload({ value, onChange, label = "Cover image", hint, compact = false }: ImageUploadProps) {
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
        <div className={`relative rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-overlay)] group ${compact ? "w-32 h-32" : "aspect-video"}`}>
          <Image src={value} alt="Upload" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-crust)]/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-[var(--color-surface-overlay)] ${compact ? "w-32 h-32" : "aspect-video gap-3"}`}
        >
          {loading ? (
            <Loader2 className={`text-[var(--color-brand-crust)] animate-spin ${compact ? "w-6 h-6" : "w-8 h-8"}`} />
          ) : (
            <>
              <div className={`rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center ${compact ? "w-9 h-9" : "w-12 h-12"}`}>
                <Upload className={`text-[var(--color-ink-muted)] ${compact ? "w-4 h-4" : "w-5 h-5"}`} />
              </div>
              {compact ? (
                <p className="text-xs text-[var(--color-ink-subtle)] text-center px-2">Add photo</p>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    Drop an image or click to upload
                  </p>
                  <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">
                    JPEG, PNG, WebP up to 5MB
                  </p>
                </div>
              )}
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

      {error && <p className="text-xs text-[var(--color-brand-danger)]">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--color-ink-subtle)]">{hint}</p>}
    </div>
  );
}
