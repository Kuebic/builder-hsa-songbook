/**
 * Shared API Response Schemas
 * Zod schemas for API responses with TypeScript type inference
 */

import { z } from "zod";

// Base response schemas
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const baseResponseSchema = z.object({
  success: z.boolean(),
  error: apiErrorSchema.optional(),
});

// Favorites-specific schemas
export const favoriteItemSchema = z.object({
  userId: z.string(),
  itemId: z.string(),
  type: z.enum(["song", "arrangement"]),
  createdAt: z.string(),
});

export const addFavoriteResponseSchema = baseResponseSchema.extend({
  data: z.object({
    success: z.boolean(),
    message: z.string(),
    favorite: favoriteItemSchema,
  }).optional(),
});

export const removeFavoriteResponseSchema = baseResponseSchema.extend({
  data: z.object({
    success: z.boolean(),
    message: z.string(),
  }).optional(),
});

export const checkFavoriteResponseSchema = z.object({
  userId: z.string(),
  songId: z.string().optional(),
  arrangementId: z.string().optional(),
  isFavorite: z.boolean(),
});

export const favoriteSongSchema = z.object({
  _id: z.string(),
  title: z.string(),
  artist: z.string().optional(),
  slug: z.string(),
  themes: z.array(z.string()),
  compositionYear: z.number().optional(),
  ccli: z.string().optional(),
  metadata: z.object({
    ratings: z.object({
      average: z.number(),
    }),
    views: z.number(),
  }),
});

export const favoriteArrangementSchema = z.object({
  _id: z.string(),
  name: z.string(),
  key: z.string().optional(),
  difficulty: z.string().optional(),
  tags: z.array(z.string()),
  metadata: z.object({
    ratings: z.object({
      average: z.number(),
    }),
    views: z.number(),
    isMashup: z.boolean(),
  }),
});

export const favoritesResponseSchema = z.object({
  songs: z.array(favoriteSongSchema).optional(),
  arrangements: z.array(favoriteArrangementSchema).optional(),
});

// Type inference from schemas
export type ApiError = z.infer<typeof apiErrorSchema>;
export type BaseResponse = z.infer<typeof baseResponseSchema>;
export type FavoriteItem = z.infer<typeof favoriteItemSchema>;
export type AddFavoriteResponse = z.infer<typeof addFavoriteResponseSchema>;
export type RemoveFavoriteResponse = z.infer<typeof removeFavoriteResponseSchema>;
export type CheckFavoriteResponse = z.infer<typeof checkFavoriteResponseSchema>;
export type FavoriteSong = z.infer<typeof favoriteSongSchema>;
export type FavoriteArrangement = z.infer<typeof favoriteArrangementSchema>;
export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>;