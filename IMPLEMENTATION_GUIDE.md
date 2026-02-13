# TMDB Integration - Implementation Examples

## What's Been Added to tmdb.ts

### New Types & Interfaces

```typescript
interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  cast_id: number;
  order: number;
}

interface MovieCredits {
  cast: CastMember[];
  crew: CrewMember[];
  id: number;
}

interface MovieVideo {
  key: string; // YouTube video ID
  name: string; // Video title
  type: string; // "Trailer", "Teaser", "Clip" etc
  site: string; // "YouTube"
  official: boolean;
  // ... more fields
}

interface MovieVideos {
  id: number;
  results: MovieVideo[];
}
```

### New Methods

#### 1. Get Movie Credits (Cast & Crew)

```typescript
const credits = await tmdbService.getMovieCredits(movieId);
// Access:
// - credits.cast: Array of CastMember
// - credits.crew: Array of CrewMember
```

#### 2. Get Movie Videos (Trailers)

```typescript
const videos = await tmdbService.getMovieVideos(movieId);
// Access:
// - videos.results: Array of MovieVideo objects
```

#### 3. Get Everything in ONE Call (OPTIMIZED)

```typescript
// This makes a single API request instead of 3!
const movieData =
  await tmdbService.getMovieDetailsWithCreditsAndVideos(movieId);

// Access all data from one response:
movieData.title; // Movie title
movieData.overview; // Movie description
movieData.credits.cast; // Cast array
movieData.credits.crew; // Crew array
movieData.videos.results; // Videos/trailers array
```

#### 4. Extract Trailer URL

```typescript
const trailerUrl = tmdbService.getTrailerUrl(movieData.videos);
// Returns: "https://www.youtube.com/embed/VIDEO_KEY"
// Or null if no trailer found
```

#### 5. Get Actor Profile Image

```typescript
const actorImage = tmdbService.getProfileUrl(actor.profile_path, "w342");
// Returns: "https://image.tmdb.org/t/p/w342/actor_image.jpg"
```

---

## Usage in Your Movie Details Page

### Current Setup (Using Individual Methods)

```typescript
const { data: movie } = useGetMovieByIdQuery(movieId);
// Single method - only gets basic details
```

### Optimized Setup (All in One)

```typescript
// Create a new RTK Query endpoint for this
const getMovieDetailsWithExtras = api.endpoints.getMovieById.matchFulfilled;

// Or use directly:
const movieData =
  await tmdbService.getMovieDetailsWithCreditsAndVideos(movieId);

// Then use:
const trailerUrl = tmdbService.getTrailerUrl(movieData.videos);
const topCast = movieData.credits.cast.slice(0, 5); // Top 5 actors
const director = movieData.credits.crew.find((c) => c.job === "Director");
```

---

## Practical Example for Movie Details Page

### Get Top 5 Cast Members

```typescript
const cast = movieData.credits.cast.slice(0, 5).map((actor) => ({
  name: actor.name,
  character: actor.character,
  image: tmdbService.getProfileUrl(actor.profile_path, "w185"),
}));

cast.forEach((actor) => {
  console.log(`${actor.name} as ${actor.character}`);
  console.log(`Image: ${actor.image}`);
});
```

### Get Director

```typescript
const director = movieData.credits.crew.find(
  (c) => c.department === "Directing" && c.job === "Director",
);

if (director) {
  console.log(`Directed by: ${director.name}`);
}
```

### Get All Trailers

```typescript
const allTrailers = movieData.videos.results
  .filter((v) => v.type === "Trailer" && v.site === "YouTube")
  .map((trailer) => ({
    name: trailer.name,
    url: `https://www.youtube.com/embed/${trailer.key}`,
    official: trailer.official,
  }));

// Get only official trailers
const officialTrailers = allTrailers.filter((t) => t.official);
```

### Display in React

```jsx
import { tmdbService } from "@/lib/tmdb";

export default function MovieDetailsPage({ movieId }) {
  const [movieData, setMovieData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Single optimized request for all data
      const data =
        await tmdbService.getMovieDetailsWithCreditsAndVideos(movieId);
      setMovieData(data);
    };
    fetchData();
  }, [movieId]);

  if (!movieData) return <div>Loading...</div>;

  return (
    <div>
      <h1>{movieData.title}</h1>

      {/* Trailer */}
      <iframe
        src={tmdbService.getTrailerUrl(movieData.videos)}
        width="100%"
        height="400"
      />

      {/* Cast */}
      <div className="cast-section">
        {movieData.credits.cast.slice(0, 5).map((actor) => (
          <div key={actor.id}>
            <img
              src={tmdbService.getProfileUrl(actor.profile_path)}
              alt={actor.name}
            />
            <p>{actor.name}</p>
            <p className="character">{actor.character}</p>
          </div>
        ))}
      </div>

      {/* About */}
      <p>{movieData.overview}</p>
    </div>
  );
}
```

---

## API Efficiency

### Before (3 requests):

```
Request 1: /movie/{id}              → Basic details
Request 2: /movie/{id}/credits      → Cast & crew
Request 3: /movie/{id}/videos       → Trailers
Total: 3 API calls
```

### After (1 request):

```
Request 1: /movie/{id}?append_to_response=credits,videos
Total: 1 API call ✅
```

**Savings:** 66% fewer API calls! 🚀

---

## Error Handling

```typescript
try {
  const movieData =
    await tmdbService.getMovieDetailsWithCreditsAndVideos(movieId);

  // Check if data exists
  const trailer = movieData.videos?.results?.[0];
  const cast = movieData.credits?.cast ?? [];
} catch (error) {
  console.error("Failed to fetch movie data:", error);
}
```

---

## Next Steps

1. Update your RTK Query endpoint to use `getMovieDetailsWithCreditsAndVideos`
2. Use `getTrailerUrl()` to generate iframe URLs
3. Map through `cast` array to display actor cards
4. Extract crew info for director/writer/producer sections
