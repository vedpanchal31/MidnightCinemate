import dotenv from "dotenv";
dotenv.config();

import { tmdbService } from "../src/lib/tmdb";

async function testTMDB() {
  console.log("🎬 Testing TMDB API Integration...\n");

  try {
    // Test 1: Fetch Now Playing Movies
    console.log("1️⃣ Fetching Now Playing movies...");
    const nowPlaying = await tmdbService.getNowPlaying(1);
    console.log(`✅ Found ${nowPlaying.results.length} now playing movies`);
    if (nowPlaying.results.length > 0) {
      const firstMovie = nowPlaying.results[0];
      console.log(
        `   Example: "${firstMovie.title}" (${firstMovie.release_date})`,
      );
      console.log(
        `   Poster: ${tmdbService.getPosterUrl(firstMovie.poster_path)}`,
      );
    }
    console.log();

    // Test 2: Fetch Upcoming Movies
    console.log("2️⃣ Fetching Upcoming movies...");
    const upcoming = await tmdbService.getUpcoming(1);
    console.log(`✅ Found ${upcoming.results.length} upcoming movies`);
    if (upcoming.results.length > 0) {
      const firstMovie = upcoming.results[0];
      console.log(
        `Example: "${firstMovie.title}" (${firstMovie.release_date})`,
      );
    }
    console.log();

    // Test 3: Fetch Popular Movies
    console.log("3️⃣ Fetching Popular movies...");
    const popular = await tmdbService.getPopular(1);
    console.log(`✅ Found ${popular.results.length} popular movies`);
    if (popular.results.length > 0) {
      const firstMovie = popular.results[0];
      console.log(
        `   Example: "${firstMovie.title}" (Rating: ${firstMovie.vote_average}/10)`,
      );
    }
    console.log();

    // Test 4: Get Movie Details
    if (nowPlaying.results.length > 0) {
      const movieId = nowPlaying.results[0].id;
      console.log(`4️⃣ Fetching details for movie ID ${movieId}...`);
      const details = await tmdbService.getMovieDetails(movieId);
      console.log(`✅ Movie: "${details.title}"`);
      console.log(`   Runtime: ${details.runtime} minutes`);
      console.log(`   Genres: ${details.genres.map((g) => g.name).join(", ")}`);
      console.log(`   Tagline: ${details.tagline || "N/A"}`);
      console.log();
    }

    // Test 5: Search Movies
    console.log('5️⃣ Searching for "Avengers"...');
    const searchResults = await tmdbService.searchMovies("Avengers", 1);
    console.log(`✅ Found ${searchResults.total_results} results`);
    if (searchResults.results.length > 0) {
      console.log(`   Top 3 results:`);
      searchResults.results.slice(0, 3).forEach((movie, index) => {
        console.log(
          `   ${index + 1}. "${movie.title}" (${movie.release_date?.split("-")[0] || "N/A"})`,
        );
      });
    }
    console.log();

    console.log("✅ All TMDB API tests passed!\n");
    console.log("📝 Summary:");
    console.log(`   - Now Playing: ${nowPlaying.total_results} movies`);
    console.log(`   - Upcoming: ${upcoming.total_results} movies`);
    console.log(`   - Popular: ${popular.total_results} movies`);
    console.log(`   - Search works: ✅`);
    console.log(`   - Movie details works: ✅`);
  } catch (error) {
    console.error("\n❌ TMDB API Test Failed:", error);
    if (
      error instanceof Error &&
      error.message.includes("TMDB_API_KEY is not configured")
    ) {
      console.log("\n📌 Next Steps:");
      console.log("   1. Visit https://www.themoviedb.org/");
      console.log("   2. Create an account");
      console.log("   3. Go to Settings > API");
      console.log("   4. Request an API Key (Developer)");
      console.log(
        "   5. Add it to your .env file as TMDB_API_KEY=your_key_here",
      );
    }
    process.exit(1);
  }
}

testTMDB();
