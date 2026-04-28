"use client";

import { useState } from "react";
import Image from "next/image";

interface CoverImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export function CoverImage({ src, alt, priority, sizes, className }: CoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-overlay)] text-5xl select-none">
        🍞
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
