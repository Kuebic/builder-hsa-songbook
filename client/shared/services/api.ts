// API client for interacting with the backend server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');

export interface APISong {
  _id: string;
  title: string;
  artist?: string;
  slug: string;
  chordData: string; // Base64 compressed ChordPro data from MongoDB
  key?: string;
  tempo?: number;
  timeSignature?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  themes: string[];
  source?: string;
  lyrics?: string;
  notes?: string;
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    isPublic: boolean;
    ratings: {
      average: number;
      count: number;
    };
    views: number;
  };
  documentSize: number;
  createdAt: string;
  updatedAt: string;
  __v?: number; // MongoDB version field
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    compressed: boolean;
    cacheHit: boolean;
  };
  error?: string;
}

export interface SongFilters {
  search?: string;
  key?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  themes?: string;
  limit?: number;
  offset?: number;
  isPublic?: boolean;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Songs API methods
  async getSongs(filters: SongFilters = {}): Promise<APIResponse<APISong[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/songs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<APISong[]>(endpoint);
  }

  async getSong(id: string): Promise<APIResponse<APISong>> {
    return this.request<APISong>(`/songs/${id}`);
  }

  async searchSongs(query: string, limit = 20): Promise<APIResponse<APISong[]>> {
    const searchParams = new URLSearchParams({
      search: query,
      limit: String(limit),
    });
    
    return this.request<APISong[]>(`/songs/search?${searchParams.toString()}`);
  }

  // Health check
  async healthCheck(): Promise<APIResponse<{ status: string; database: any }>> {
    return this.request<{ status: string; database: any }>('/health');
  }

  // User favorites methods
  async getUserFavorites(userId: string): Promise<APIResponse<APISong[]>> {
    return this.request<APISong[]>(`/users/${userId}/favorites`);
  }

  async addFavorite(userId: string, songId: string): Promise<APIResponse<{ userId: string; songId: string; message: string }>> {
    return this.request<{ userId: string; songId: string; message: string }>(
      `/users/${userId}/favorites/${songId}`,
      { method: 'POST' }
    );
  }

  async removeFavorite(userId: string, songId: string): Promise<APIResponse<{ userId: string; songId: string; message: string }>> {
    return this.request<{ userId: string; songId: string; message: string }>(
      `/users/${userId}/favorites/${songId}`,
      { method: 'DELETE' }
    );
  }

  async checkFavorite(userId: string, songId: string): Promise<APIResponse<{ userId: string; songId: string; isFavorite: boolean }>> {
    return this.request<{ userId: string; songId: string; isFavorite: boolean }>(
      `/users/${userId}/favorites/check/${songId}`
    );
  }
}

export const apiClient = new APIClient();