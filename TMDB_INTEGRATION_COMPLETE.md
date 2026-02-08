# TMDB API Integration - Complete Setup ✅

## Overview

I've integrated The Movie Database (TMDB) API to fetch real movie data for your Cinemate application. This provides access to:
- Now Playing movies
- Upcoming movies
- Popular movies
- Movie search
- Detailed movie information

## 🔑 Getting Your TMDB API Key

### Step 1: Create TMDB Account
1. Visit [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Click "Join TMDB" (top right)
3. Fill in your details and verify your email

### Step 2: Request API Key
1. Log in to your TMDB account
2. Click on your profile icon → **Settings**
3. In the left sidebar, click **API**
4. Click **"Request an API Key"** or **"Create"**
5. Choose **"Developer"** option
6. Accept the terms of use

### Step 3: Fill Application Details
- **Application Name:** Cinemate
- **Application URL:** `http://localhost:3000`
- **Application Summary:** Movie booking and theater management system

### Step 4: Copy Your API Key
Once approved (usually instant), copy your **API Key (v3 auth)**

### Step 5: Update .env File
Open your `.env` file and replace `your_tmdb_api_key_here` with your actual API key:

```env
TMDB_API_KEY=your_actual_api_key_here
```

## 📁 Files Created

### 1. TMDB Service (`src/lib/tmdb.ts`)
Core service for interacting with TMDB API:
- `getNowPlaying()` - Get movies currently in theaters
- `getUpcoming()` - Get upcoming movies
- `getPopular()` - Get popular movies
- `getTopRated()` - Get top-rated movies
- `getMovieDetails(id)` - Get detailed movie information
- `searchMovies(query)` - Search for movies
- `getPosterUrl(path, size)` - Get full poster image URL
- `getBackdropUrl(path, size)` - Get full backdrop image URL
- `getGenreName(id)` - Convert genre ID to name

### 2. API Routes

#### `/api/movies/now-playing`
Fetch movies currently in theaters
```bash
GET /api/movies/now-playing?page=1
```

#### `/api/movies/upcoming`
Fetch upcoming movies
```bash
GET /api/movies/upcoming?page=1
```

#### `/api/movies/popular`
Fetch popular movies
```bash
GET /api/movies/popular?page=1
```

#### `/api/movies/[id]`
Get detailed information about a specific movie
```bash
GET /api/movies/123
```

#### `/api/movies/search`
Search for movies
```bash
GET /api/movies/search?q=Avengers&page=1
```

### 3. Test Script (`scripts/test-tmdb.ts`)
Test your TMDB integration:
```bash
npm run tmdb:test
```

## 🧪 Testing the Integration

### Before Testing
Make sure you've added your TMDB API key to `.env`:
```env
TMDB_API_KEY=your_actual_key_here
```

### Run the Test
```bash
npm run tmdb:test
```

Expected output:
```
🎬 Testing TMDB API Integration...

1️⃣ Fetching Now Playing movies...
✅ Found 20 now playing movies
   Example: "Movie Title" (2024-01-15)
   Poster: https://image.tmdb.org/t/p/w500/path.jpg

2️⃣ Fetching Upcoming movies...
✅ Found 20 upcoming movies
...

✅ All TMDB API tests passed!
```

## 🌐 Using in Your Application

### Example: Fetch Now Playing Movies

```typescript
// In a Server Component
import { tmdbService } from '@/lib/tmdb';

export default async function MoviesPage() {
  const movies = await tmdbService.getNowPlaying();
  
  return (
    <div>
      {movies.results.map(movie => (
        <div key={movie.id}>
          <h2>{movie.title}</h2>
          <img src={tmdbService.getPosterUrl(movie.poster_path)} alt={movie.title} />
          <p>{movie.overview}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: Using API Routes (Client Component)

```typescript
'use client';
import { useEffect, useState } from 'react';

export default function MoviesClient() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetch('/api/movies/now-playing')
      .then(res => res.json())
      .then(data => setMovies(data.results));
  }, []);

  return (
    <div>
      {movies.map(movie => (
        <div key={movie.id}>
          <h2>{movie.title}</h2>
          <img src={movie.poster_url} alt={movie.title} />
        </div>
      ))}
    </div>
  );
}
```

## 📊 Response Format

### Movie List Response
```json
{
  "page": 1,
  "results": [
    {
      "id": 123,
      "title": "Movie Title",
      "overview": "Movie description...",
      "poster_path": "/path.jpg",
      "poster_url": "https://image.tmdb.org/t/p/w500/path.jpg",
      "backdrop_path": "/path.jpg",
      "backdrop_url": "https://image.tmdb.org/t/p/w1280/path.jpg",
      "release_date": "2024-01-15",
      "vote_average": 8.5,
      "vote_count": 1234,
      "genre_ids": [28, 12, 14],
      "genres": ["Action", "Adventure", "Fantasy"]
    }
  ],
  "total_pages": 100,
  "total_results": 2000
}
```

### Movie Details Response
```json
{
  "id": 123,
  "title": "Movie Title",
  "overview": "Detailed description...",
  "runtime": 148,
  "genres": [
    { "id": 28, "name": "Action" },
    { "id": 12, "name": "Adventure" }
  ],
  "release_date": "2024-01-15",
  "vote_average": 8.5,
  "tagline": "Movie tagline",
  "poster_url": "https://...",
  "backdrop_url": "https://..."
}
```

## 🎨 Image Sizes Available

### Poster Sizes
- `w92` - Very small (92px wide)
- `w154` - Small (154px wide)
- `w185` - Thumbnail (185px wide)
- `w342` - Medium (342px wide)
- `w500` - Large (500px wide) **[Default]**
- `w780` - Extra large (780px wide)
- `original` - Original size

### Backdrop Sizes
- `w300` - Small (300px wide)
- `w780` - Medium (780px wide)
- `w1280` - Large (1280px wide) **[Default]**
- `original` - Original size

## 🎬 Genre IDs

| ID | Genre |
|----|-------|
| 28 | Action |
| 12 | Adventure |
| 16 | Animation |
| 35 | Comedy |
| 80 | Crime |
| 99 | Documentary |
| 18 | Drama |
| 10751 | Family |
| 14 | Fantasy |
| 27 | Horror |
| 9648 | Mystery |
| 10749 | Romance |
| 878 | Science Fiction |
| 53 | Thriller |
| 10752 | War |
| 37 | Western |

## 🚀 Next Steps

1. ✅ Get your TMDB API key
2. ✅ Add it to `.env` file
3. ✅ Run `npm run tmdb:test` to verify
4. ✅ Start using the API in your pages
5. 🎯 Update your movie pages to use real data
6. 🎯 Implement search functionality
7. 🎯 Create movie detail pages

## 📝 API Limits

- **Free Tier:** 40 requests per 10 seconds
- **No daily limit** for personal use
- **Attribution required** (add TMDB logo to your app)

## 🔗 Useful Links

- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [TMDB API Settings](https://www.themoviedb.org/settings/api)
- [Image Configuration](https://developers.themoviedb.org/3/configuration/get-api-configuration)

## ⚠️ Important Notes

1. **Never commit your API key** - It's already in `.gitignore`
2. **Add TMDB attribution** - Required by their terms of use
3. **Cache responses** - Consider caching for better performance
4. **Handle errors** - Always wrap API calls in try-catch

## 🎉 You're All Set!

Once you add your API key, you'll have access to thousands of movies with:
- High-quality posters and backdrops
- Detailed movie information
- Real-time data updates
- Search functionality
- Genre information
- Ratings and reviews

Happy coding! 🚀
