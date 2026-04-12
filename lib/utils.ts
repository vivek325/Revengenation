/** Convert a title into a URL-safe slug (max 80 chars). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80)
    .replace(/-+$/g, "");
}

/** Build a story URL: /story/my-post-title */
export function storyUrl(_id: number, title: string): string {
  const slug = slugify(title);
  return slug ? `/story/${slug}` : `/story/${_id}`;
}

/** Returns numeric ID for legacy "/story/1234567890" URLs, null for slug URLs. */
export function parseStoryId(param: string): number | null {
  if (/^\d+$/.test(param)) return Number(param);
  return null;
}
