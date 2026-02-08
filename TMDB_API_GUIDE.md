# TMDB API Integration Guide

## Getting Your API Key

1. Visit https://www.themoviedb.org/
2. Create an account and verify your email
3. Go to Settings > API
4. Request an API Key (choose "Developer")
5. Fill in the application details:
   - Application Name: Cinemate
   - Application URL: http://localhost:3000
   - Application Summary: Movie booking application
6. Copy your API Key

## Add to .env

Once you have your API key, add it to your `.env` file:

```env
TMDB_API_KEY=your_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

## Available Endpoints

- Now Playing: `/movie/now_playing`
- Popular: `/movie/popular`
- Top Rated: `/movie/top_rated`
- Upcoming: `/movie/upcoming`
- Movie Details: `/movie/{movie_id}`
- Search: `/search/movie`

## Image Sizes

- Poster: w92, w154, w185, w342, w500, w780, original
- Backdrop: w300, w780, w1280, original

## Example Response

```json
{
  "results": [
    {
      "id": 123,
      "title": "Movie Title",
      "overview": "Movie description...",
      "poster_path": "/path.jpg",
      "backdrop_path": "/path.jpg",
      "release_date": "2024-01-01",
      "vote_average": 8.5,
      "genre_ids": [28, 12, 14]
    }
  ]
}
```
