/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {
  Movie,
  useGetHindiQuery,
  useGetNowPlayingQuery,
} from "@/store/moviesApi";
import { ChevronLeft, Star } from "lucide-react";
import CinemateLogo from "/public/Cinemate.jpg";
import { Button } from "@/components/ui/button";

// Movie placeholder component for missing posters
const MoviePlaceholder = ({ movie }: { movie: Movie }) => (
  <div className="w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-dashed border-white/20">
    <img
      src="/Cinemate.jpg"
      alt="Cinemate Logo"
      className="w-full h-full object-cover opacity-75"
    />
  </div>
);

type MovieGridProps = {
  movies: Movie[];
};

function MovieGrid({ movies }: MovieGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {movies.map((movie) => (
        <div
          key={movie.id}
          className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
        >
          <div className="aspect-2/3 relative">
            {movie.poster_url ? (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    // Create placeholder element
                    const placeholder = document.createElement("div");
                    placeholder.className =
                      "w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-dashed border-white/20";
                    placeholder.innerHTML = `
                      <div class="text-center p-4">
                        <div class="text-4xl mb-2">🎬</div>
                        <div class="text-white/60 text-sm font-medium">${movie.title}</div>
                        <div class="text-white/40 text-xs mt-1">${new Date(movie.release_date).getFullYear()}</div>
                      </div>
                    `;
                    parent.appendChild(placeholder);
                  }
                }}
              />
            ) : (
              <MoviePlaceholder movie={movie} />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <Button asChild className="w-full">
                <Link href={`/booking/${movie.id}`}>Book Tickets</Link>
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-lg leading-tight truncate">
                {movie.title}
              </h3>
              <span className="text-primary font-bold text-sm flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary" />{" "}
                {movie.vote_average.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{movie.genres.join(", ")}</span>
              <span>•</span>
              <span>{new Date(movie.release_date).getFullYear()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MoviesSections() {
  const { data: nowPlayingData, isFetching: isNowPlayingLoading } =
    useGetNowPlayingQuery();
  const { data: hindiData, isFetching: isHindiLoading } = useGetHindiQuery();

  const nowPlaying = nowPlayingData?.results ?? [];
  const hindiMovies = hindiData?.results ?? [];

  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Now Showing
          </h1>
          <p className="text-muted-foreground">
            Book tickets for the latest blockbusters
          </p>
        </div>
      </div>

      {isNowPlayingLoading ? (
        <p className="text-sm text-muted-foreground">
          Loading now playing movies…
        </p>
      ) : (
        <MovieGrid movies={nowPlaying} />
      )}

      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hindi Spotlight</h2>
          <p className="text-muted-foreground">
            Popular releases from Bollywood and beyond
          </p>
        </div>
        {isHindiLoading ? (
          <p className="text-sm text-muted-foreground">Loading Hindi movies…</p>
        ) : (
          <MovieGrid movies={hindiMovies} />
        )}
      </section>
    </>
  );
}
