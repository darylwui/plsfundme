import { sanitizeRichHtml } from "./sanitize";

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
