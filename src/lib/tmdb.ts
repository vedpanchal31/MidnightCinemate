import dotenv from "dotenv";
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL =
  process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p";

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

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  cast_id: number;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  department: string;
  job: string;
  profile_path: string | null;
}

export interface MovieCredits {
  cast: CastMember[];
  crew: CrewMember[];
  id: number;
}

export interface MovieVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  official: boolean;
  published_at: string;
  site: string;
  size: number;
  type: string;
}

export interface MovieVideos {
  id: number;
  results: MovieVideo[];
}

export interface MovieDetailsExtended extends MovieDetails {
  credits?: MovieCredits;
  videos?: MovieVideos;
}

class TMDBService {
  private apiKey: string;
  private baseUrl: string;
  private imageBaseUrl: string;

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error(
        "TMDB_API_KEY is not configured. Please add your API key to .env file. " +
          "Get your API key from https://www.themoviedb.org/settings/api",
      );
    }
    this.apiKey = TMDB_API_KEY;
    this.baseUrl = TMDB_BASE_URL;
    this.imageBaseUrl = TMDB_IMAGE_BASE_URL;
  }

  private async fetch<T>(
    endpoint: string,
    params: Record<string, string> = {},
    retries: number = 2,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Build query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Determine if we're using Bearer token or API key
    const isBearerToken = this.apiKey.startsWith("eyJ"); // JWT tokens start with eyJ

    const headers: HeadersInit = {
      "User-Agent": "Cinemate/1.0",
    };

    if (isBearerToken) {
      // Use Bearer token authentication
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      headers["Content-Type"] = "application/json";
    } else {
      // Use API key in query params
      url.searchParams.append("api_key", this.apiKey);
    }

    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(
          `[TMDB] Fetching (attempt ${attempt}/${retries}): ${url.toString()}`,
        );
        const response = await fetch(url.toString(), {
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[TMDB] API Error ${response.status}: ${errorText}`);
          throw new Error(
            `TMDB API Error: ${response.status} ${response.statusText} - ${errorText}`,
          );
        }

        const data = await response.json();
        console.log(`[TMDB] Success: Got response for ${endpoint}`);
        return data;
      } catch (error) {
        lastError = error as Error;
        console.error(`[TMDB] Error on attempt ${attempt}:`, error);

        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          const waitTime = 1000 * attempt;
          console.log(`[TMDB] Retrying after ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }

    throw lastError || new Error("Failed to fetch from TMDB API");
  }

  /**
   * Get movies currently in theaters
   */
  async getNowPlaying(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>("/movie/now_playing", {
      page: page.toString(),
    });
  }

  /**
   * Get popular movies
   */
  async getPopular(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>("/movie/popular", {
      page: page.toString(),
    });
  }

  /**
   * Get top rated movies
   */
  async getTopRated(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>("/movie/top_rated", {
      page: page.toString(),
    });
  }

  /**
   * Get upcoming movies
   */
  async getUpcoming(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>("/movie/upcoming", {
      page: page.toString(),
    });
  }

  /**
   * Get popular Hindi movies
   */
  async getHindiMovies(page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>("/discover/movie", {
      page: page.toString(),
      sort_by: "popularity.desc",
      with_original_language: "hi",
    });
  }

  /**
   * Get detailed information about a specific movie
   */
  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    return this.fetch<MovieDetails>(`/movie/${movieId}`);
  }

  /**
   * Get movie credits (cast and crew)
   */
  async getMovieCredits(movieId: number): Promise<MovieCredits> {
    return this.fetch<MovieCredits>(`/movie/${movieId}/credits`);
  }

  /**
   * Get movie videos (trailers, clips, teasers, etc.)
   */
  async getMovieVideos(
    movieId: number,
    language: string = "en-US",
  ): Promise<MovieVideos> {
    return this.fetch<MovieVideos>(`/movie/${movieId}/videos`, { language });
  }

  /**
   * Get movie details with credits and videos in a single request
   * More efficient than making 3 separate API calls
   */
  async getMovieDetailsWithCreditsAndVideos(
    movieId: number,
  ): Promise<MovieDetailsExtended> {
    return this.fetch<MovieDetailsExtended>(`/movie/${movieId}`, {
      append_to_response: "credits,videos",
      language: "en-US",
    });
  }

  /**
   * Search for movies
   */
  async searchMovies(query: string, page = 1): Promise<TMDBResponse> {
    return this.fetch<TMDBResponse>("/search/movie", {
      query,
      page: page.toString(),
    });
  }

  /**
   * Get full image URL for poster
   * @param path - The poster_path from TMDB
   * @param size - Image size (w92, w154, w185, w342, w500, w780, original)
   */
  getPosterUrl(
    path: string | null,
    size:
      | "w92"
      | "w154"
      | "w185"
      | "w342"
      | "w500"
      | "w780"
      | "original" = "w500",
  ): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  /**
   * Get full image URL for backdrop
   * @param path - The backdrop_path from TMDB
   * @param size - Image size (w300, w780, w1280, original)
   */
  getBackdropUrl(
    path: string | null,
    size: "w300" | "w780" | "w1280" | "original" = "w1280",
  ): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  /**
   * Get genre name by ID
   */
  getGenreName(genreId: number): string {
    const genres: Record<number, string> = {
      28: "Action",
      12: "Adventure",
      16: "Animation",
      35: "Comedy",
      80: "Crime",
      99: "Documentary",
      18: "Drama",
      10751: "Family",
      14: "Fantasy",
      36: "History",
      27: "Horror",
      10402: "Music",
      9648: "Mystery",
      10749: "Romance",
      878: "Science Fiction",
      10770: "TV Movie",
      53: "Thriller",
      10752: "War",
      37: "Western",
    };
    return genres[genreId] || "Unknown";
  }

  /**
   * Get YouTube trailer URL from videos response
   * @param videos - MovieVideos response from TMDB
   * @returns YouTube embed URL or null if no trailer found
   */
  getTrailerUrl(videos?: MovieVideos): string | null {
    if (!videos || !videos.results) return null;

    // Find official trailer first
    const trailer =
      videos.results.find(
        (v) => v.type === "Trailer" && v.site === "YouTube" && v.official,
      ) ||
      // If no official trailer, get any trailer
      videos.results.find((v) => v.type === "Trailer" && v.site === "YouTube");

    if (!trailer) return null;
    return `https://www.youtube.com/embed/${trailer.key}`;
  }

  /**
   * Get profile image URL
   * @param profilePath - Profile path from TMDB
   * @param size - Image size (w185, w342, h632, original)
   */
  getProfileUrl(
    profilePath: string | null,
    size: "w185" | "w342" | "h632" | "original" = "w185",
  ): string | null {
    if (!profilePath) return null;
    return `${this.imageBaseUrl}/${size}${profilePath}`;
  }
}

// Export singleton instance
export const tmdbService = new TMDBService();
export default tmdbService;
