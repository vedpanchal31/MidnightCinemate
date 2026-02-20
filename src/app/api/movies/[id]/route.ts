import { NextResponse } from "next/server";
import { tmdbService } from "@/lib/tmdb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id);

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const movie = await tmdbService.getMovieDetails(movieId);

    // Transform the response to include full image URLs and genre names
    const transformedMovie = {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_url: tmdbService.getPosterUrl(movie.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movie.backdrop_path),
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      genres: movie.genres?.map((g) => g.name) || [],
      runtime: movie.runtime,
      tagline: movie.tagline,
      status: movie.status,
    };

    return NextResponse.json(transformedMovie);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch movie details";
    const statusMatch =
      error instanceof Error
        ? error.message.match(/TMDB API Error:\s*(\d{3})/)
        : null;
    const statusCode = statusMatch ? Number(statusMatch[1]) : 502;

    return NextResponse.json(
      {
        error: "Failed to fetch movie details",
        details: message,
      },
      { status: statusCode },
    );
  }
}
