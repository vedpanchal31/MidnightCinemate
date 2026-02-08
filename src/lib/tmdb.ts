import dotenv from 'dotenv';
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface MovieDetails extends TMDBMovie {
  runtime: number;
  genres: { id: number; name: string }[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
}

class TMDBService {
  private apiKey: string;
  private baseUrl: string;
  private imageBaseUrl: string;

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error(
        'TMDB_API_KEY is not configured. Please add your API key to .env file. ' +
        'Get your API key from https://www.themoviedb.org/settings/api'
      );
    }
    this.apiKey = TMDB_API_KEY;
    this.baseUrl = TMDB_BASE_URL;
    this.imageBaseUrl = TMDB_IMAGE_BASE_URL;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}, retries: number = 2): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Build query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Determine if we're using Bearer token or API key
    const isBearerToken = this.apiKey.startsWith('eyJ'); // JWT tokens start with eyJ
    
    const headers: HeadersInit = {
      'User-Agent': 'Cinemate/1.0',
    };
    
    if (isBearerToken) {
      // Use Bearer token authentication
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['Content-Type'] = 'application/json';
    } else {
      // Use API key in query params
      url.searchParams.append('api_key', this.apiKey);
    }

    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url.toString(), { 
          headers,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch from TMDB API');
  }

  /**
   * Get movies currently in theaters
   */
  async getNowPlaying(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>('/movie/now_playing', { page: page.toString() });
  }

  /**
   * Get popular movies
   */
  async getPopular(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>('/movie/popular', { page: page.toString() });
  }

  /**
   * Get top rated movies
   */
  async getTopRated(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>('/movie/top_rated', { page: page.toString() });
  }

  /**
   * Get upcoming movies
   */
  async getUpcoming(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>('/movie/upcoming', { page: page.toString() });
  }

  /**
   * Get popular Hindi movies
   */
  async getHindiMovies(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>('/discover/movie', {
      page: page.toString(),
      sort_by: 'popularity.desc',
      with_original_language: 'hi',
    });
  }

  /**
   * Get detailed information about a specific movie
   */
  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    return this.fetch<MovieDetails>(`/movie/${movieId}`);
  }

  /**
   * Search for movies
   */
  async searchMovies(query: string, page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>('/search/movie', { 
      query,
      page: page.toString() 
    });
  }

  /**
   * Get full image URL for poster
   * @param path - The poster_path from TMDB
   * @param size - Image size (w92, w154, w185, w342, w500, w780, original)
   */
  getPosterUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  /**
   * Get full image URL for backdrop
   * @param path - The backdrop_path from TMDB
   * @param size - Image size (w300, w780, w1280, original)
   */
  getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  /**
   * Get genre name by ID
   */
  getGenreName(genreId: number): string {
    const genres: Record<number, string> = {
      28: 'Action',
      12: 'Adventure',
      16: 'Animation',
      35: 'Comedy',
      80: 'Crime',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      14: 'Fantasy',
      36: 'History',
      27: 'Horror',
      10402: 'Music',
      9648: 'Mystery',
      10749: 'Romance',
      878: 'Science Fiction',
      10770: 'TV Movie',
      53: 'Thriller',
      10752: 'War',
      37: 'Western',
    };
    return genres[genreId] || 'Unknown';
  }
}

// Export singleton instance
export const tmdbService = new TMDBService();
export default tmdbService;
