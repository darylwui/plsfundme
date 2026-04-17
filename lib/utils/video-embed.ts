/**
 * Convert a YouTube / Vimeo URL to an embeddable iframe URL.
 * Returns null if the URL is not recognised so callers can fall back
 * to a plain link instead of rendering a broken iframe.
 */
export function toEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  // YouTube: youtube.com/watch?v=ID  |  youtu.be/ID  |  youtube.com/shorts/ID
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = url.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${encodeURIComponent(v)}`;
    const shorts = url.pathname.match(/^\/shorts\/([^/?#]+)/);
    if (shorts) return `https://www.youtube.com/embed/${encodeURIComponent(shorts[1])}`;
    const embed = url.pathname.match(/^\/embed\/([^/?#]+)/);
    if (embed) return `https://www.youtube.com/embed/${encodeURIComponent(embed[1])}`;
    return null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split(/[/?#]/)[0];
    if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    return null;
  }

  // Vimeo: vimeo.com/ID  |  player.vimeo.com/video/ID
  if (host === "vimeo.com") {
    const id = url.pathname.replace(/^\//, "").split(/[/?#]/)[0];
    if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    return null;
  }
  if (host === "player.vimeo.com") {
    const match = url.pathname.match(/^\/video\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }

  return null;
}
