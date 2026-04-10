/** Generate a URL-safe slug from a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Append a short random suffix to ensure slug uniqueness */
export function slugifyUnique(text: string): string {
  const base = slugify(text)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}
