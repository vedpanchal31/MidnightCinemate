import { NextResponse } from "next/server";
import { tmdbService } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const today = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const releaseDateLte = today.toISOString().split("T")[0];
    const releaseDateGte = ninetyDaysAgo.toISOString().split("T")[0];

    const movies = await tmdbService.getHindiMovies(page, {
      releaseDateGte,
      releaseDateLte,
    });

    const transformedResults = movies.results.map((movie) => ({
      ...movie,
      poster_url: movie.poster_path
        ? movie.poster_path.startsWith("http")
          ? movie.poster_path
          : tmdbService.getPosterUrl(movie.poster_path)
        : null,
      backdrop_url: movie.backdrop_path
        ? movie.backdrop_path.startsWith("http")
          ? movie.backdrop_path
          : tmdbService.getBackdropUrl(movie.backdrop_path)
        : null,
      genres: movie.genre_ids.map((id) => tmdbService.getGenreName(id)),
    }));

    return NextResponse.json({
      ...movies,
      results: transformedResults,
    });
  } catch (error) {
    console.error("Error fetching Hindi movies:", error);
    return NextResponse.json({
      page: 1,
      results: [],
      total_pages: 1,
      total_results: 0,
      error: error instanceof Error ? error.message : "Failed to fetch movies",
    });
  }
}
