import { NextResponse } from 'next/server';
import { tmdbService } from '@/lib/tmdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');

    const movies = await tmdbService.getPopular(page);

    // Transform the response to include full image URLs
    const transformedResults = movies.results.map(movie => ({
      ...movie,
      poster_url: tmdbService.getPosterUrl(movie.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movie.backdrop_path),
      genres: movie.genre_ids.map(id => tmdbService.getGenreName(id)),
    }));

    return NextResponse.json({
      ...movies,
      results: transformedResults,
    });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
