/** Two-letter avatar fallback from a name (or the email when there is no name). */
export function initials(name: string | null, email: string | null): string {
  const src = (name?.trim() || email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : src.slice(0, 2).toUpperCase();
}
