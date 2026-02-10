# TMDB API Integration Guide

## Available TMDB Endpoints for Movie Data

### 1. **Movie Details**

**Endpoint:** `GET /movie/{movie_id}`

**What you get:**

- Title, overview, poster, backdrop
- Release date, budget, revenue
- Runtime, status, genres
- Vote average, vote count

**Example:**

```
GET https://api.themoviedb.org/3/movie/550?api_key=YOUR_KEY&language=en-US
```

---

### 2. **Movie Credits (Cast & Crew)**

**Endpoint:** `GET /movie/{movie_id}/credits`

**What you get:**

- Cast list with:
  - Actor name
  - Character name
  - Profile image path
  - Cast order
- Crew list with:
  - Department (director, writer, producer, etc.)
  - Job title
  - Name and profile

**Example:**

```
GET https://api.themoviedb.org/3/movie/550/credits?api_key=YOUR_KEY
```

**Response:**

```json
{
  "cast": [
    {
      "id": 819,
      "name": "Edward Norton",
      "character": "Narrator",
      "profile_path": "/path/to/image.jpg",
      "cast_id": 0,
      "order": 0
    }
  ],
  "crew": [
    {
      "id": 7399,
      "name": "David Fincher",
      "department": "Directing",
      "job": "Director",
      "profile_path": "/path/to/image.jpg"
    }
  ]
}
```

---

### 3. **Movie Videos (Trailers, Clips, etc.)**

**Endpoint:** `GET /movie/{movie_id}/videos`

**What you get:**

- Trailer videos
- Teaser videos
- Clips
- Featurettes
- Each with:
  - Name
  - Type (Trailer, Teaser, Clip, etc.)
  - Key (YouTube video ID)
  - Language
  - Size (resolution)

**Example:**

```
GET https://api.themoviedb.org/3/movie/550/videos?api_key=YOUR_KEY&language=en-US
```

**Response:**

```json
{
  "results": [
    {
      "id": "533ec654c3a36b6e23000d00",
      "iso_639_1": "en",
      "iso_3166_1": "US",
      "key": "SUXWAEX9jlg",
      "name": "Fight Club - Official Trailer",
      "official": true,
      "published_at": "2014-03-20T18:41:00.000Z",
      "site": "YouTube",
      "size": 1080,
      "type": "Trailer"
    }
  ]
}
```

---

### 4. **Optimized: Using append_to_response**

You can combine multiple endpoints in ONE request to reduce API calls!

**Single Request:**

```
GET https://api.themoviedb.org/3/movie/550?api_key=YOUR_KEY&append_to_response=credits,videos
```

**This returns:**

- Movie details
- Credits (cast & crew)
- Videos (trailers)

All in a single response!

---

## How to Get Trailer URL

Once you have the video data:

1. Find a video with `type: "Trailer"` and `site: "YouTube"`
2. Use the `key` to construct YouTube URL:
   ```
   https://www.youtube.com/embed/{key}
   ```

Example:

```
https://www.youtube.com/embed/SUXWAEX9jlg
```

---

## Implemented Methods in tmdb.ts

### New Methods Added:

```typescript
// Get movie credits (cast and crew)
async getMovieCredits(movieId: number): Promise<MovieCredits>

// Get movie videos (trailers, clips, etc.)
async getMovieVideos(movieId: number): Promise<MovieVideos>

// Get movie details with credits and videos in one call
async getMovieDetailsWithCreditsAndVideos(movieId: number): Promise<MovieDetailsExtended>
```

---

## Usage Examples

### Get Full Movie Data with Trailer and Cast:

```typescript
// Single optimized request
const movieData = await tmdbService.getMovieDetailsWithCreditsAndVideos(550);

// Access data:
console.log(movieData.title); // "Fight Club"
console.log(movieData.credits.cast); // Array of cast members
console.log(movieData.videos.results); // Array of trailers/videos
```

### Get Only Credits:

```typescript
const credits = await tmdbService.getMovieCredits(550);
console.log(credits.cast.slice(0, 5)); // Top 5 cast members
```

### Get Only Videos:

```typescript
const videos = await tmdbService.getMovieVideos(550);
const trailer = videos.results.find(
  (v) => v.type === "Trailer" && v.site === "YouTube",
);
const trailerUrl = `https://www.youtube.com/embed/${trailer.key}`;
```

---

## Important Notes

1. **Image URLs:** Use `tmdbService.getPosterUrl()` and `tmdbService.getBackdropUrl()`
2. **Profile Pictures:** Construct using: `https://image.tmdb.org/t/p/w200{profile_path}`
3. **YouTube URLs:** Always check `site === 'YouTube'` before using the `key`
4. **Rate Limiting:** TMDB allows 40 requests per 10 seconds
5. **Language:** Specify `language=en-US` for English results

---

## API Response Status

- **✅ Working**: Movie details, credits, videos
- **⚠️ Note**: Some movies may have missing trailers or cast info
- **❌ Limitations**: Real-time seat availability is NOT in TMDB (custom implementation needed)
