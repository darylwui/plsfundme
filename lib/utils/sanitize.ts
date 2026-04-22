import sanitizeHtml from "sanitize-html";

/**
 * Sanitize rich-text HTML from our TipTap editor before rendering to users.
 *
 * The TipTap editor only surfaces a limited set of marks/blocks to creators,
 * but the API accepts raw HTML so we defend in depth here. This is called on
 * both the server-rendered project page and the client-side preview.
 *
 * Why `sanitize-html` and not `DOMPurify` / `isomorphic-dompurify`:
 * `isomorphic-dompurify` pulls in `jsdom`, which transitively requires
 * `@exodus/bytes/encoding-lite.js`. That file flipped to ESM-only and the
 * bundled `html-encoding-sniffer` still uses `require()` on it — Vercel's
 * Lambda runtime then throws `ERR_REQUIRE_ESM` at module-load time, crashing
 * the project detail page on every request. `sanitize-html` is pure JS with
 * no jsdom/CJS↔ESM drama, works identically in SSR and browser bundles, and
 * uses a whitelist model that maps cleanly from the old DOMPurify config.
 */

// Tags the TipTap editor can emit (marks + blocks + media embeds).
const ALLOWED_TAGS = [
  "a", "b", "blockquote", "br", "code", "em", "i", "img", "li", "ol", "p",
  "pre", "s", "strong", "u", "ul", "h1", "h2", "h3", "h4", "h5", "h6",
  "hr", "span", "div", "figure", "figcaption", "iframe",
];

// Attributes allowed on ANY tag. `sanitize-html` keys allowed attrs by tag —
// using `*` gives us the same "allow everywhere, let schema checks filter
// URLs" behaviour the DOMPurify config had.
const ALLOWED_ATTRS: Record<string, string[]> = {
  "*": [
    "href", "target", "rel", "src", "alt", "title",
    "width", "height", "class", "id",
    "allow", "allowfullscreen", "frameborder",
  ],
};

// Restrict URL schemes — blocks `javascript:`, `data:`, etc. Matches the
// previous `ALLOWED_URI_REGEXP` intent (http/https + mail/tel + relative).
const ALLOWED_SCHEMES = ["http", "https", "mailto", "tel"];

// Only let iframes embed YouTube/Vimeo; block arbitrary origins.
const ALLOWED_IFRAME_HOSTNAMES = [
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
];

export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
    // Drop inline styles + event handlers outright; the whitelist above
    // already excludes them, but be explicit in case the lists drift.
    disallowedTagsMode: "discard",
  });
}
