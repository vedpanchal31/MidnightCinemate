import { NextResponse } from "next/server";
import { tmdbService } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let movieId: string | null = null;
  try {
    const { id } = await params;
    movieId = id;
    const parsedMovieId = parseInt(id);

    if (isNaN(parsedMovieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    // Get movie details with credits and videos in a single optimized request
    const movie =
      await tmdbService.getMovieDetailsWithCreditsAndVideos(parsedMovieId);

    // Extract trailer
    const trailerUrl = tmdbService.getTrailerUrl(movie.videos);

    // Transform cast data
    const cast =
      movie.credits?.cast?.map((actor) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profile_url: tmdbService.getProfileUrl(actor.profile_path, "w185"),
        order: actor.order,
      })) || [];

    // Extract director and other key crew
    const crew = movie.credits?.crew || [];
    const director = crew.find((c) => c.job === "Director");
    const writer = crew.find((c) => c.department === "Writing");
    const producer = crew.find((c) => c.job === "Producer");

    // Get all videos
    const videos =
      movie.videos?.results?.map((video) => ({
        id: video.id,
        name: video.name,
        type: video.type,
        key: video.key,
        site: video.site,
        official: video.official,
        url:
          video.site === "YouTube"
            ? `https://www.youtube.com/embed/${video.key}`
            : null,
      })) || [];

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
      budget: movie.budget,
      revenue: movie.revenue,

      // Cast and crew
      cast: cast.slice(0, 10), // Top 10 cast members
      director: director
        ? {
            id: director.id,
            name: director.name,
            profile_url: tmdbService.getProfileUrl(
              director.profile_path,
              "w185",
            ),
          }
        : null,
      writer: writer
        ? {
            id: writer.id,
            name: writer.name,
          }
        : null,
      producer: producer
        ? {
            id: producer.id,
            name: producer.name,
          }
        : null,

      // Videos and trailers
      trailer_url: trailerUrl,
      videos: videos.filter((v) => v.site === "YouTube"),
    };

    return NextResponse.json(transformedMovie);
  } catch (error) {
    console.error("Error fetching extended movie details:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorDetails = {
      error: "Failed to fetch movie details",
      details: errorMessage,
      movieId: movieId,
    };
    console.error("Error details:", errorDetails);
    return NextResponse.json(errorDetails, { status: 500 });
  }
}
