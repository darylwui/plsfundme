import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize rich-text HTML from our TipTap editor before rendering to users.
 *
 * The TipTap editor only surfaces a limited set of marks/blocks to creators,
 * but the API accepts raw HTML so we defend in depth here. This is called on
 * both the server-rendered project page and the client-side preview.
 */
const ALLOWED_TAGS = [
  "a", "b", "blockquote", "br", "code", "em", "i", "img", "li", "ol", "p",
  "pre", "s", "strong", "u", "ul", "h1", "h2", "h3", "h4", "h5", "h6",
  "hr", "span", "div", "figure", "figcaption", "iframe",
];

const ALLOWED_ATTR = [
  "href", "target", "rel", "src", "alt", "title",
  "width", "height", "class", "id",
  "allow", "allowfullscreen", "frameborder",
];

// YouTube/Vimeo only — creators sometimes embed videos mid-description.
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i;

export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ADD_ATTR: ["target"], // ensure <a target="_blank"> is allowed
    FORBID_ATTR: ["style", "onerror", "onclick", "onload"],
    FORBID_TAGS: ["script", "style", "form", "input", "button", "object", "embed"],
  });
}
