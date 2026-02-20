/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Movie, useSearchMoviesQuery } from "@/store/moviesApi";
import { Star, ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePagination } from "@/hooks";

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

export default function MovieSearch() {
  const {
    currentPage,
    totalPages,
    debouncedValue,
    handleSearch,
    searchTerm,
    clearSearch,
    goToPage,
    nextPage,
    prevPage,
    handleTotalPages,
  } = usePagination(12);

  const trimmedQuery = useMemo(() => debouncedValue.trim(), [debouncedValue]);

  const { data, isFetching, isError } = useSearchMoviesQuery(
    { query: trimmedQuery, page: currentPage },
    { skip: !trimmedQuery },
  );

  const movies: Movie[] = data?.results ?? [];
  const totalPagesFromApi = data?.total_pages ?? 1;

  // Update total pages when API data changes
  useMemo(() => {
    if (totalPagesFromApi !== totalPages) {
      handleTotalPages(totalPagesFromApi);
    }
  }, [totalPagesFromApi, totalPages, handleTotalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <label
          htmlFor="movie-search"
          className="text-sm uppercase tracking-[0.3em] text-muted-foreground"
        >
          Search movies
        </label>
        <div className="relative">
          <input
            id="movie-search"
            type="text"
            placeholder="Search for a movie, actor, or genre"
            value={searchTerm}
            onChange={(event) => handleSearch(event.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 pr-12 text-base text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {isFetching && (
        <p className="text-sm text-muted-foreground">
          Searching for “{trimmedQuery}”…
        </p>
      )}

      {isError && (
        <p className="text-sm text-red-400">Failed to search movies.</p>
      )}

      {!isFetching && trimmedQuery && movies.length === 0 && !isError && (
        <p className="text-sm text-muted-foreground">
          No matches found. Try another title.
        </p>
      )}

      {movies.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
              >
                <div className="aspect-2/3 relative">
                  {movie.poster_url ? (
                    <>
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          console.log(
                            "Image failed to load:",
                            movie.poster_url,
                          );
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
                    </>
                  ) : (
                    <MoviePlaceholder movie={movie} />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <Button asChild className="w-full">
                      <Link href={`/movie-details/${movie.id}`}>
                        Book Tickets
                      </Link>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
