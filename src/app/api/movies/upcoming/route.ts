import { NextResponse } from 'next/server';
import { tmdbService } from '@/lib/tmdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');

    const movies = await tmdbService.getUpcoming(page);

    // Transform the response to include full image URLs
    const transformedResults = movies.results.map(movie => ({
      ...movie,
      poster_url: movie.poster_path ? 
        (movie.poster_path.startsWith('http') ? movie.poster_path : tmdbService.getPosterUrl(movie.poster_path)) :
        null,
      backdrop_url: movie.backdrop_path ? 
        (movie.backdrop_path.startsWith('http') ? movie.backdrop_path : tmdbService.getBackdropUrl(movie.backdrop_path)) :
        null,
      genres: movie.genre_ids.map(id => tmdbService.getGenreName(id)),
    }));

    return NextResponse.json({
      ...movies,
      results: transformedResults,
    });
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
