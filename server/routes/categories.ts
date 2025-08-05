import { Request, Response } from "express";
import { z } from "zod";
import { Song } from "../database/models/Song";
import type { QueryFilter, SortCriteria } from '../../shared/types/api.types';

// Spiritual category mapping rules (server-side version)
const CATEGORY_MAPPING_RULES = [
  {
    categoryId: 'traditional-holy',
    name: 'Traditional Holy Songs',
    themes: ['holy', 'sacred', 'divine principle', 'true parents'],
    sources: ['holy songbook', 'unification hymnal'],
    titlePatterns: ['holy', 'sacred', 'divine'],
  },
  {
    categoryId: 'new-holy',
    name: 'New Holy Songs',
    themes: ['new age', 'restoration', 'cheon il guk'],
    sources: ['recent compositions', 'modern holy songs'],
    titlePatterns: [],
  },
  {
    categoryId: 'american-pioneer',
    name: 'American Pioneer Songs',
    themes: ['pioneering', 'witnessing', 'generation of righteousness'],
    sources: ['american pioneers', '1970s-1980s'],
    artists: ['joshua cotter', 'dan fefferman', 'julia moon'],
    titlePatterns: [],
  },
  {
    categoryId: 'contemporary-christian',
    name: 'Contemporary Christian',
    themes: ['praise', 'contemporary worship', 'modern christian'],
    sources: ['hillsong', 'bethel', 'elevation', 'ccm'],
    artists: ['chris tomlin', 'hillsong', 'bethel music'],
    titlePatterns: [],
  },
  {
    categoryId: 'classic-hymns',
    name: 'Classic Hymns',
    themes: ['hymn', 'traditional', 'classic', 'historic'],
    sources: ['hymnal', 'traditional hymns', 'church history'],
    titlePatterns: ['amazing grace', 'how great thou art', 'blessed assurance'],
  },
  {
    categoryId: 'original-interchurch',
    name: 'Original Interchurch',
    themes: ['community', 'fellowship', 'local church'],
    sources: ['community submitted', 'interchurch', 'user contributed'],
    titlePatterns: [],
  },
];

// Validation schema for category stats query
const categoryStatsQuerySchema = z.object({
  includeEmpty: z.coerce.boolean().default(false),
  sortBy: z.enum(['popularity', 'count', 'rating', 'alphabetical']).default('popularity'),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// Validation schema for category songs query
const categorySongsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['popular', 'recent', 'rating', 'title']).default('popular'),
  searchQuery: z.string().optional(),
});

export async function getCategoryStats(req: Request, res: Response) {
  try {
    // Check database connection first
    const { database } = await import("../database/connection");
    if (!database.isConnectedToDatabase()) {
      return res.status(503).json({
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Database connection is not available",
          details: "The server is currently unable to connect to the database. Please try again later.",
        },
      });
    }

    // Validate query parameters
    const queryResult = categoryStatsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: queryResult.error.errors,
        },
      });
    }

    const { includeEmpty, sortBy, limit } = queryResult.data;

    // Efficient MongoDB aggregation for category statistics
    const categoryStats = await Song.aggregate([
      // Stage 1: Match published songs only
      { 
        $match: { 
          "metadata.isPublic": true,
          $or: [
            { themes: { $exists: true, $not: { $size: 0 } } },
            { source: { $exists: true, $ne: "" } },
            { artist: { $exists: true, $ne: "" } }
          ]
        } 
      },
      
      // Stage 2: Add category assignments based on mapping rules
      {
        $addFields: {
          assignedCategories: {
            $filter: {
              input: CATEGORY_MAPPING_RULES.map(rule => ({
                categoryId: rule.categoryId,
                name: rule.name,
                score: {
                  $add: [
                    // Theme matching score
                    {
                      $cond: [
                        { $gt: [{ $size: { $setIntersection: ["$themes", rule.themes] } }, 0] },
                        10,
                        0
                      ]
                    },
                    // Source matching score
                    {
                      $cond: [
                        { 
                          $and: [
                            { $ne: ["$source", null] },
                            { 
                              $gt: [
                                { 
                                  $size: { 
                                    $filter: {
                                      input: rule.sources,
                                      cond: { 
                                        $regexMatch: { 
                                          input: { $toLower: "$source" }, 
                                          regex: { $toLower: "$$this" } 
                                        } 
                                      }
                                    }
                                  }
                                }, 
                                0
                              ]
                            }
                          ]
                        },
                        8,
                        0
                      ]
                    },
                    // Artist matching score
                    {
                      $cond: [
                        { 
                          $and: [
                            { $ne: ["$artist", null] },
                            { 
                              $gt: [
                                { 
                                  $size: { 
                                    $filter: {
                                      input: rule.artists || [],
                                      cond: { 
                                        $regexMatch: { 
                                          input: { $toLower: "$artist" }, 
                                          regex: { $toLower: "$$this" } 
                                        } 
                                      }
                                    }
                                  }
                                }, 
                                0
                              ]
                            }
                          ]
                        },
                        7,
                        0
                      ]
                    },
                    // Title pattern matching score
                    {
                      $cond: [
                        { 
                          $gt: [
                            { 
                              $size: { 
                                $filter: {
                                  input: rule.titlePatterns,
                                  cond: { 
                                    $regexMatch: { 
                                      input: { $toLower: "$title" }, 
                                      regex: { $toLower: "$$this" } 
                                    } 
                                  }
                                }
                              }
                            }, 
                            0
                          ]
                        },
                        6,
                        0
                      ]
                    }
                  ]
                }
              })),
              cond: { $gte: ["$$this.score", 5] } // Minimum score threshold
            }
          }
        }
      },
      
      // Stage 3: Unwind categories for grouping
      { $unwind: { path: "$assignedCategories", preserveNullAndEmptyArrays: false } },
      
      // Stage 4: Group by category with statistics
      {
        $group: {
          _id: "$assignedCategories.categoryId",
          name: { $first: "$assignedCategories.name" },
          songCount: { $sum: 1 },
          avgRating: { $avg: "$metadata.ratings.average" },
          totalViews: { $sum: "$metadata.views" },
          recentCount: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          topSongs: {
            $push: {
              $cond: [
                { $gte: ["$metadata.ratings.average", 4.0] },
                { 
                  id: { $toString: "$_id" },
                  title: "$title", 
                  artist: "$artist", 
                  rating: "$metadata.ratings.average" 
                },
                "$$REMOVE"
              ]
            }
          }
        }
      },
      
      // Stage 5: Calculate popularity score and format results
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$avgRating", 0] }, 2] },
              { $divide: [{ $ifNull: ["$totalViews", 0] }, 100] },
              { $multiply: ["$recentCount", 3] }
            ]
          },
          topSongs: { 
            $slice: [
              { 
                $sortArray: { 
                  input: "$topSongs", 
                  sortBy: { rating: -1 } 
                } 
              }, 
              3 
            ] 
          }
        }
      },
      
      // Stage 6: Filter empty categories if requested
      ...(includeEmpty ? [] : [{ $match: { songCount: { $gt: 0 } } }]),
      
      // Stage 7: Sort by requested criteria
      {
        $sort: {
          ...(sortBy === 'popularity' && { popularityScore: -1 }),
          ...(sortBy === 'count' && { songCount: -1 }),
          ...(sortBy === 'rating' && { avgRating: -1 }),
          ...(sortBy === 'alphabetical' && { name: 1 }),
        }
      },
      
      // Stage 8: Limit results
      { $limit: limit },
      
      // Stage 9: Project final format
      {
        $project: {
          id: "$_id",
          name: 1,
          songCount: 1,
          avgRating: { $round: [{ $ifNull: ["$avgRating", 0] }, 1] },
          recentCount: 1,
          popularityScore: { $round: ["$popularityScore", 1] },
          topSongs: 1,
          lastUpdated: new Date(),
          _id: 0
        }
      }
    ]);
    
    // Add missing categories with zero counts if requested
    if (includeEmpty) {
      const existingCategoryIds = new Set(categoryStats.map(stat => stat.id));
      const missingCategories = CATEGORY_MAPPING_RULES
        .filter(rule => !existingCategoryIds.has(rule.categoryId))
        .map(rule => ({
          id: rule.categoryId,
          name: rule.name,
          songCount: 0,
          avgRating: 0,
          recentCount: 0,
          popularityScore: 0,
          topSongs: [],
          lastUpdated: new Date(),
        }));
      
      categoryStats.push(...missingCategories);
    }
    
    res.json({
      success: true,
      data: categoryStats,
      meta: { 
        totalCategories: categoryStats.length,
        generated: new Date().toISOString(),
        cacheHit: false 
      }
    });
  } catch (error) {
    console.error('Category stats error:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: "CATEGORY_STATS_ERROR", 
        message: "Failed to fetch category statistics" 
      }
    });
  }
}

export async function getCategorySongs(req: Request, res: Response) {
  try {
    // Check database connection
    const { database } = await import("../database/connection");
    if (!database.isConnectedToDatabase()) {
      return res.status(503).json({
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Database connection is not available",
        },
      });
    }

    const { categoryId } = req.params;

    // Validate category ID
    const validCategoryIds = CATEGORY_MAPPING_RULES.map(rule => rule.categoryId);
    if (!validCategoryIds.includes(categoryId)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CATEGORY_NOT_FOUND",
          message: "Invalid category ID",
        },
      });
    }

    // Validate query parameters
    const queryResult = categorySongsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: queryResult.error.errors,
        },
      });
    }

    const { page, limit, sortBy, searchQuery } = queryResult.data;
    const skip = (page - 1) * limit;

    // Get category mapping rule
    const categoryRule = CATEGORY_MAPPING_RULES.find(rule => rule.categoryId === categoryId);
    if (!categoryRule) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CATEGORY_NOT_FOUND",
          message: "Category not found",
        },
      });
    }

    // Build category filter query
    const categoryFilter: QueryFilter = {
      "metadata.isPublic": true,
      $or: []
    };

    // Add theme filters
    if (categoryRule.themes.length > 0 && categoryFilter.$or) {
      categoryFilter.$or.push({
        themes: { $in: categoryRule.themes.map(t => new RegExp(t, 'i')) }
      });
    }

    // Add source filters
    if (categoryRule.sources && categoryRule.sources.length > 0 && categoryFilter.$or) {
      categoryFilter.$or.push({
        source: { $in: categoryRule.sources.map(s => new RegExp(s, 'i')) }
      });
    }

    // Add artist filters
    if (categoryRule.artists && categoryRule.artists.length > 0 && categoryFilter.$or) {
      categoryFilter.$or.push({
        artist: { $in: categoryRule.artists.map(a => new RegExp(a, 'i')) }
      });
    }

    // Add title pattern filters
    if (categoryRule.titlePatterns.length > 0 && categoryFilter.$or) {
      categoryFilter.$or.push({
        title: { $in: categoryRule.titlePatterns.map(p => new RegExp(p, 'i')) }
      });
    }

    // If no OR conditions, remove the $or operator
    if (categoryFilter.$or && categoryFilter.$or.length === 0) {
      delete categoryFilter.$or;
    }

    // Add search query filter if provided
    if (searchQuery && searchQuery.trim()) {
      categoryFilter.$text = { $search: searchQuery.trim() };
    }

    // Build sort criteria
    let sortCriteria: SortCriteria = {};
    switch (sortBy) {
      case 'popular':
        sortCriteria = { "metadata.views": -1, "metadata.ratings.average": -1 };
        break;
      case 'recent':
        sortCriteria = { createdAt: -1 };
        break;
      case 'rating':
        sortCriteria = { "metadata.ratings.average": -1, "metadata.views": -1 };
        break;
      case 'title':
        sortCriteria = { title: 1 };
        break;
      default:
        sortCriteria = { "metadata.ratings.average": -1 };
    }

    // If using text search, sort by relevance first
    if (searchQuery && searchQuery.trim()) {
      sortCriteria = { score: { $meta: "textScore" }, ...sortCriteria };
    }

    // Execute query with pagination
    const [songs, totalCount] = await Promise.all([
      Song.find(categoryFilter)
        .select('title artist slug themes source metadata createdAt')
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Song.countDocuments(categoryFilter)
    ]);

    // Transform songs to client format
    const transformedSongs = songs.map(song => ({
      id: song._id.toString(),
      title: song.title,
      artist: song.artist || '',
      slug: song.slug,
      themes: song.themes || [],
      source: song.source || '',
      viewCount: song.metadata?.views || 0,
      avgRating: song.metadata?.ratings?.average || 0,
      createdAt: song.createdAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: transformedSongs,
      meta: {
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        category: {
          id: categoryId,
          name: categoryRule.name,
        },
        appliedFilters: {
          sortBy,
          searchQuery: searchQuery || null,
        }
      }
    });

  } catch (error) {
    console.error('Category songs error:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: "CATEGORY_SONGS_ERROR", 
        message: "Failed to fetch category songs" 
      }
    });
  }
}