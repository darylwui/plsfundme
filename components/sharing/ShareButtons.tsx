"use client";

import { useState } from "react";
import { Link2, Check, MessageCircle, Send } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  compact?: boolean;
}

export function ShareButtons({ url, title, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const text = `Check out "${title}" on get that bread — Singapore's crowdfunding platform for founders`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select a temp input
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const btnBase = compact
    ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-btn)] text-xs font-semibold transition-colors duration-[150ms] border"
    : "inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-btn)] text-sm font-semibold transition-colors duration-[150ms] border";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopy}
        className={`${btnBase} ${
          copied
            ? "bg-[var(--color-brand-success)]/10 border-[var(--color-brand-success)] text-[var(--color-brand-success)]"
            : "bg-[var(--color-surface-overlay)] border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]"
        }`}
      >
        {copied ? <Check className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} /> : <Link2 className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />}
        {copied ? "Copied!" : "Copy link"}
      </button>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} bg-[#25D366]/10 border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/20 hover:border-[#25D366]/60`}
      >
        <MessageCircle className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        WhatsApp
      </a>

      {/* Telegram */}
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} bg-[#229ED9]/10 border-[#229ED9]/30 text-[#229ED9] hover:bg-[#229ED9]/20 hover:border-[#229ED9]/60`}
      >
        <Send className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        Telegram
      </a>

      {/* X / Twitter */}
      <a
        href={`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} bg-[var(--color-surface-overlay)] border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]`}
      >
        <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X
      </a>
    </div>
  );
}
