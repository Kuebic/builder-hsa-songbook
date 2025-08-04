import { useState, useEffect, useCallback } from 'react';
import { apiClient, APISong, SongFilters } from '@/shared/services/api';
import { ClientSong, Song, songToClientFormat } from '@features/songs';

// Error types for better error handling
export interface TransformationError {
  songId: string;
  songTitle: string;
  error: string;
  severity: 'warning' | 'error';
}

export interface APIError {
  type: 'network' | 'validation' | 'transformation' | 'server';
  message: string;
  details?: unknown;
  retryable: boolean;
}

// Transform API song data to client song format using existing function
function transformAPISongToClientSong(apiSong: APISong): ClientSong {
  // Convert APISong to Song format first
  const song: Song = {
    _id: apiSong._id,
    title: apiSong.title,
    artist: apiSong.artist,
    slug: apiSong.slug,
    chordData: apiSong.chordData,
    key: apiSong.key,
    tempo: apiSong.tempo,
    timeSignature: apiSong.timeSignature,
    difficulty: apiSong.difficulty,
    themes: apiSong.themes,
    source: apiSong.source || '',
    lyrics: apiSong.lyrics,
    notes: apiSong.notes,
    metadata: apiSong.metadata,
    documentSize: apiSong.documentSize,
    createdAt: apiSong.createdAt,
    updatedAt: apiSong.updatedAt,
  };
  
  // Use the existing transformation function
  return songToClientFormat(song);
}

// Validate API song structure before transformation
function validateAPISong(apiSong: unknown): apiSong is APISong {
  if (!apiSong || typeof apiSong !== 'object') return false;
  
  const song = apiSong as Partial<APISong>;
  return !!(song._id && song.title && song.difficulty && Array.isArray(song.themes));
}

// Safe wrapper for transformation with error boundary
function safeTransformAPISongToClientSong(
  apiSong: APISong, 
  userFavorites: string[] = []
): { song: ClientSong | null; error: TransformationError | null } {
  // First validate the API song structure
  if (!validateAPISong(apiSong)) {
    const validationError: TransformationError = {
      songId: (apiSong as Partial<APISong>)?._id || 'unknown',
      songTitle: (apiSong as Partial<APISong>)?.title || 'Unknown Song',
      error: 'Invalid API song structure - missing required fields',
      severity: 'error'
    };
    return { song: null, error: validationError };
  }

  try {
    const clientSong = transformAPISongToClientSong(apiSong);
    // Set favorite status based on user's favorites list
    clientSong.isFavorite = userFavorites.includes(apiSong._id);
    return { song: clientSong, error: null };
  } catch (error) {
    console.error(`Failed to transform song ${apiSong._id} (${apiSong.title}):`, error);
    
    const transformationError: TransformationError = {
      songId: apiSong._id,
      songTitle: apiSong.title,
      error: error instanceof Error ? error.message : 'Unknown transformation error',
      severity: 'warning'
    };
    
    // Return a fallback ClientSong with minimal safe data
    const fallbackSong: ClientSong = {
      id: apiSong._id,
      title: apiSong.title || 'Unknown Title',
      artist: apiSong.artist,
      key: apiSong.key,
      tempo: apiSong.tempo,
      difficulty: apiSong.difficulty || 'intermediate',
      themes: apiSong.themes || [],
      viewCount: apiSong.metadata?.views || 0,
      avgRating: apiSong.metadata?.ratings?.average || 0,
      basicChords: [], // Safe fallback for corrupted chord data
      lastUsed: undefined,
      isFavorite: userFavorites.includes(apiSong._id), // Set favorite status even for fallback
      chordData: '', // Safe fallback to prevent further errors
    };
    
    return { song: fallbackSong, error: transformationError };
  }
}

// Transform array of API songs with enhanced error handling
function safeTransformSongs(apiSongs: unknown[], userFavorites: string[] = []): { 
  songs: ClientSong[]; 
  errors: TransformationError[];
  successCount: number;
} {
  const songs: ClientSong[] = [];
  const errors: TransformationError[] = [];
  let successCount = 0;
  
  for (const apiSong of apiSongs) {
    const { song, error } = safeTransformAPISongToClientSong(apiSong as APISong, userFavorites);
    
    if (song) {
      songs.push(song);
      successCount++;
    }
    
    if (error) {
      errors.push(error);
    }
  }
  
  return { songs, errors, successCount };
}

export interface UseSongsOptions {
  filters?: SongFilters;
  autoFetch?: boolean;
  userId?: string; // Optional user ID for favorite status
}

export interface UseSongsResult {
  songs: ClientSong[];
  loading: boolean;
  error: APIError | null;
  total: number;
  page: number;
  limit: number;
  transformationErrors: TransformationError[];
  successCount: number;
  fetchSongs: (filters?: SongFilters) => Promise<void>;
  refetch: () => Promise<void>;
  searchSongs: (query: string, limit?: number) => Promise<void>;
  toggleFavorite: (songId: string) => Promise<void>;
  retry: () => Promise<void>;
}

export function useSongs({ 
  filters = {}, 
  autoFetch = true,
  userId 
}: UseSongsOptions = {}): UseSongsResult {
  const [songs, setSongs] = useState<ClientSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [transformationErrors, setTransformationErrors] = useState<TransformationError[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<SongFilters>(filters);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);

  const fetchSongs = useCallback(async (newFilters?: SongFilters, isRetry = false) => {
    setLoading(true);
    setError(null);
    setTransformationErrors([]);
    setSuccessCount(0);
    
    if (!isRetry) {
      setRetryCount(0);
    }
    
    try {
      const filtersToUse = newFilters || currentFilters;
      setCurrentFilters(filtersToUse);
      
      const response = await apiClient.getSongs(filtersToUse);
      
      if (response.success) {
        // Validate response data structure
        if (!Array.isArray(response.data)) {
          throw new Error('API returned invalid data structure - expected array of songs');
        }
        
        const { songs: transformedSongs, errors, successCount: transformSuccessCount } = safeTransformSongs(response.data, userFavorites);
        setSongs(transformedSongs);
        setTransformationErrors(errors);
        setSuccessCount(transformSuccessCount);
        
        if (errors.length > 0) {
          console.warn(`${errors.length} songs failed to transform:`, errors);
          
          // Log detailed error information
          errors.forEach(err => {
            console.warn(`- ${err.songTitle} (${err.songId}): ${err.error}`);
          });
        }
        
        if (response.meta) {
          setTotal(response.meta.total);
          setPage(response.meta.page);
          setLimit(response.meta.limit);
        }
      } else {
        const apiError: APIError = {
          type: 'server',
          message: response.error || 'Server returned unsuccessful response',
          retryable: true
        };
        setError(apiError);
        return;
      }
    } catch (err) {
      const apiError: APIError = {
        type: err instanceof TypeError ? 'network' : 'server',
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        details: err,
        retryable: true
      };
      setError(apiError);
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilters, userFavorites]);

  const searchSongs = useCallback(async (query: string, searchLimit = 20) => {
    setLoading(true);
    setError(null);
    setTransformationErrors([]);
    
    try {
      const response = await apiClient.searchSongs(query, searchLimit);
      
      if (response.success) {
        // Validate response data structure
        if (!Array.isArray(response.data)) {
          throw new Error('Search API returned invalid data structure - expected array of songs');
        }
        
        const { songs: transformedSongs, errors, successCount: transformSuccessCount } = safeTransformSongs(response.data, userFavorites);
        setSongs(transformedSongs);
        setTransformationErrors(errors);
        setSuccessCount(transformSuccessCount);
        
        if (errors.length > 0) {
          console.warn(`${errors.length} songs failed to transform during search:`, errors);
        }
        
        if (response.meta) {
          setTotal(response.meta.total);
          setPage(response.meta.page);
          setLimit(response.meta.limit);
        }
      } else {
        const apiError: APIError = {
          type: 'server',
          message: response.error || 'Search request failed',
          retryable: true
        };
        setError(apiError);
        return;
      }
    } catch (err) {
      const apiError: APIError = {
        type: err instanceof TypeError ? 'network' : 'server',
        message: err instanceof Error ? err.message : 'Search failed',
        details: err,
        retryable: true
      };
      setError(apiError);
      console.error('Error searching songs:', err);
    } finally {
      setLoading(false);
    }
  }, [userFavorites]);

  const refetch = useCallback(async () => {
    await fetchSongs();
  }, [fetchSongs]);

  const toggleFavorite = useCallback(async (songId: string) => {
    if (!userId) {
      console.warn('Cannot toggle favorite: No user ID provided');
      return;
    }

    // Optimistic update
    setSongs(prevSongs => 
      prevSongs.map(song => 
        song.id === songId 
          ? { ...song, isFavorite: !song.isFavorite }
          : song
      )
    );

    const isCurrentlyFavorite = userFavorites.includes(songId);

    try {
      if (isCurrentlyFavorite) {
        await apiClient.removeFavorite(userId, songId);
        setUserFavorites(prev => prev.filter(id => id !== songId));
      } else {
        await apiClient.addFavorite(userId, songId);
        setUserFavorites(prev => [...prev, songId]);
      }
    } catch (error) {
      // Rollback optimistic update on error
      setSongs(prevSongs => 
        prevSongs.map(song => 
          song.id === songId 
            ? { ...song, isFavorite: !song.isFavorite }
            : song
        )
      );
      console.error('Failed to toggle favorite:', error);
    }
  }, [userId, userFavorites]);

  // Fetch user favorites when userId changes
  useEffect(() => {
    const fetchUserFavorites = async () => {
      if (!userId) {
        setUserFavorites([]);
        return;
      }

      try {
        const response = await apiClient.getUserFavorites(userId);
        if (response.success) {
          if (Array.isArray(response.data)) {
            const favoriteIds = response.data.map(song => song._id);
            setUserFavorites(favoriteIds);
          } else {
            console.warn('User favorites API returned invalid data structure');
            setUserFavorites([]);
          }
        
      } else {
        console.warn('Failed to fetch user favorites: API returned unsuccessful response');
        setUserFavorites([]);
      }
      } catch (error) {
        console.error('Failed to fetch user favorites:', error);
        setUserFavorites([]);
      }
    };

    fetchUserFavorites();
  }, [userId]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchSongs();
    }
  }, [autoFetch, fetchSongs]);

  // Retry function with exponential backoff
  const retry = useCallback(async () => {
    if (!error?.retryable) {
      console.warn('Current error is not retryable');
      return;
    }
    
    const nextRetryCount = retryCount + 1;
    const delay = Math.min(1000 * Math.pow(2, nextRetryCount - 1), 10000); // Max 10 seconds
    
    console.log(`Retrying request (attempt ${nextRetryCount}) after ${delay}ms delay...`);
    setRetryCount(nextRetryCount);
    
    setTimeout(() => {
      fetchSongs(currentFilters, true);
    }, delay);
  }, [error, retryCount, fetchSongs, currentFilters]);

  return {
    songs,
    loading,
    error,
    total,
    page,
    limit,
    transformationErrors,
    successCount,
    fetchSongs,
    refetch,
    searchSongs,
    toggleFavorite,
    retry,
  };
}