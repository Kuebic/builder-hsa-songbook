/**
 * Server-side slug generation utilities
 * Matches client-side implementation for consistency
 */

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
 * Ensures a slug is unique by appending a number if necessary
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    // Extract the base part without the random ID
    const parts = baseSlug.split("-");
    const randomId = parts.pop();
    const basePart = parts.join("-");

    // Create a new slug with a counter
    slug = `${basePart}-${counter}-${randomId}`;
    counter++;
  }

  return slug;
}
