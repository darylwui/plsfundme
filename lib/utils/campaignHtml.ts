import { sanitizeRichHtml } from "./sanitize";

/**
 * Single source of truth for how campaign-description HTML renders. Used by:
 * - the public project page ([slug]/page.tsx → ProjectPageSections)
 * - the pre-submit preview (Step4_Review)
 * - the TipTap editor itself (CampaignEditor)
 *
 * Uses Tailwind arbitrary-descendant selectors (`[&_h2]:...`) rather than the
 * @tailwindcss/typography plugin's `prose-h2:*` variants, because the plugin
 * isn't installed here. Each consumer applies this string to a wrapper div
 * and the TipTap ProseMirror node shares the same styling rules — what the
 * creator sees while authoring is the same thing that ships.
 */
export const CAMPAIGN_PROSE_CLASSES = [
  "max-w-none text-[var(--color-ink)] text-base leading-relaxed",
  // Section heading (H2) — the big one that shows in the TOC + FAQ pipeline.
  "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-[var(--color-brand-crust-dark)]",
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-[var(--color-border)]",
  // Subsection heading (H3) — nested under H2, muted.
  "[&_h3]:text-base [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[var(--color-ink-muted)]",
  // Paragraph body text.
  "[&_p]:text-[var(--color-ink)] [&_p]:leading-relaxed [&_p]:my-3",
  // Inline marks.
  "[&_a]:text-[var(--color-brand-crust)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[var(--color-brand-crust-dark)]",
  "[&_strong]:text-[var(--color-ink)] [&_strong]:font-semibold",
  "[&_em]:italic",
  "[&_u]:underline [&_u]:underline-offset-2",
  // Lists — restore browser defaults that Tailwind's preflight strips.
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3",
  "[&_li]:my-1 [&_li]:text-[var(--color-ink)]",
  // Blockquotes — left rail in brand crust.
  "[&_blockquote]:border-l-4 [&_blockquote]:border-l-[var(--color-brand-crust)] [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-[var(--color-ink)] [&_blockquote]:italic",
  // Images + rules.
  "[&_img]:rounded-[var(--radius-card)] [&_img]:border [&_img]:border-[var(--color-border)] [&_img]:my-4",
  "[&_hr]:border-[var(--color-border)] [&_hr]:my-6",
].join(" ");

export type CampaignHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type ProcessedCampaign = {
  html: string;
  headings: CampaignHeading[];
};

/**
 * Creators sometimes build "headings" by bolding (and optionally underlining)
 * a whole paragraph instead of using the editor's H2/H3 blocks. The result is
 * visually bold on-page, but invisible to the TOC / FAQ extractor and to
 * screen readers navigating by heading. Promote those paragraphs to real
 * <h2>s before ID injection so the rest of the pipeline treats them as
 * headings.
 *
 * We only match paragraphs whose ENTIRE content is a single <strong> (with an
 * optional <u> wrapper either way). In-flow bold phrases like
 * <p>Here's why <strong>this matters</strong></p> are left alone.
 */
function normalizeFauxHeadings(html: string): string {
  let out = html;
  const toH2 = (inner: string) => {
    const text = inner.trim();
    if (!text || text.length > 160) return null;
    return `<h2>${text}</h2>`;
  };

  out = out.replace(
    /<p(?:\s[^>]*)?>\s*<u[^>]*>\s*<strong[^>]*>([\s\S]*?)<\/strong>\s*<\/u>\s*<\/p>/gi,
    (m, inner: string) => toH2(inner) ?? m
  );
  out = out.replace(
    /<p(?:\s[^>]*)?>\s*<strong[^>]*>\s*<u[^>]*>([\s\S]*?)<\/u>\s*<\/strong>\s*<\/p>/gi,
    (m, inner: string) => toH2(inner) ?? m
  );
  out = out.replace(
    /<p(?:\s[^>]*)?>\s*<strong[^>]*>([\s\S]*?)<\/strong>\s*<\/p>/gi,
    (m, inner: string) => toH2(inner) ?? m
  );
  return out;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/**
 * Sanitize campaign HTML, inject stable IDs into H2/H3 tags, and return the
 * list of headings so the project page can render in-page navigation (TOC,
 * FAQ jumps, subsection pills) against the exact same IDs as the rendered
 * body.
 */
export function processCampaignHtml(raw: string | null | undefined): ProcessedCampaign {
  const sanitized = sanitizeRichHtml(raw ?? "");
  if (!sanitized) return { html: "", headings: [] };

  const normalized = normalizeFauxHeadings(sanitized);

  const headings: CampaignHeading[] = [];
  let idx = 0;

  const html = normalized.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]*>/g, "").trim();
      if (!text) return match;
      const id = `section-${slugify(text)}-${idx++}`;
      headings.push({ id, text, level: level === "2" ? 2 : 3 });
      const cleanAttrs = String(attrs ?? "").replace(/\sid="[^"]*"/gi, "");
      return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
    }
  );

  return { html, headings };
}
