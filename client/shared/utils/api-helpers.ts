/**
 * API Helper Functions
 * Centralized utilities for API endpoint construction and URL formatting
 */

/**
 * Constructs a full API URL by prepending the origin
 * @param path - The API path (should start with /)
 * @returns The full API URL
 */
export const getApiUrl = (path: string): string => {
  return `${window.location.origin}${path}`;
};

/**
 * Constructs a favorite endpoint URL
 * @param userId - The user ID
 * @param type - The type of item (song or arrangement)
 * @param itemId - The item ID
 * @returns The favorite endpoint path
 */
export const getFavoriteEndpoint = (
  userId: string, 
  type: "song" | "arrangement", 
  itemId: string,
): string => {
  const itemType = type === "song" ? "songs" : "arrangements";
  return `/api/users/${userId}/favorites/${itemType}/${itemId}`;
};

/**
 * Constructs a user favorites list endpoint URL
 * @param userId - The user ID
 * @param type - Optional filter for favorites type
 * @returns The favorites list endpoint path
 */
export const getFavoritesListEndpoint = (
  userId: string, 
  type: "songs" | "arrangements" | "both" = "both",
): string => {
  return `/api/users/${userId}/favorites?type=${type}`;
};