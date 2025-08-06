/**
 * Generates a random ID for use in arrangement slugs
 * @returns A 5-character random string
 */
export function generateRandomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a URL-friendly slug for an arrangement
 * @param songTitle - The title of the song
 * @returns A slug in format: {song-name}-{random-id}
 * @example createArrangementSlug("Amazing Grace") => "amazing-grace-x7k2n"
 */
export function createArrangementSlug(songTitle: string): string {
  // Convert to lowercase and replace spaces/special chars with hyphens
  const songSlug = songTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Trim hyphens from start and end

  const randomId = generateRandomId();
  return `${songSlug}-${randomId}`;
}

/**
 * Extracts the random ID from an arrangement slug
 * @param slug - The arrangement slug
 * @returns The random ID portion of the slug
 * @example extractIdFromSlug("amazing-grace-x7k2n") => "x7k2n"
 */
export function extractIdFromSlug(slug: string): string {
  const parts = slug.split("-");
  return parts[parts.length - 1];
}
