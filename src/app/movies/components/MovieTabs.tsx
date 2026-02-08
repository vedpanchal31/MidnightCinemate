/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useGetNowPlayingQuery, useGetHindiQuery, useGetHollywoodQuery } from "@/store/moviesApi";
import { ShimmerCard } from "@/components/ui/shimmer";
import { Star, Clapperboard, Sparkles, Theater } from "lucide-react";
import { cn } from "@/lib/utils";
import { Movie } from "@/store/moviesApi";

// Movie placeholder component for missing posters
const MoviePlaceholder = ({  }: { movie: Movie }) => (
    <div className="w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-dashed border-white/20">
        <img 
            src="/Cinemate.jpg" 
            alt="Cinemate Logo"
            className="w-full h-full object-cover opacity-75"
        />
    </div>
);

type TabType = "now-playing" | "hollywood" | "bollywood";

interface MovieTabsProps {
  onTabChange?: (tab: TabType) => void;
}

export default function MovieTabs({ onTabChange }: MovieTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("now-playing");

  const { data: nowPlayingData,isLoading:isNowPlayingLoading, isFetching: isNowPlayingFetching } = useGetNowPlayingQuery();
  const { data: hindiData, isLoading:isHindiLoading, isFetching: isHindiFetching } = useGetHindiQuery();
  const { data: hollywoodData, isLoading:isHollywoodLoading, isFetching: isHollywoodFetching } = useGetHollywoodQuery();

  const hollywoodMovies = hollywoodData?.results ?? [];
  const bollywoodMovies = hindiData?.results ?? [];
  const nowPlayingMovies = nowPlayingData?.results ?? [];

  const tabs = [
    { id: "now-playing" as TabType, label: "Now Playing", count: nowPlayingMovies.length },
    { id: "hollywood" as TabType, label: "Hollywood", count: hollywoodMovies.length },
    { id: "bollywood" as TabType, label: "Bollywood", count: bollywoodMovies.length },
  ];

  const getMoviesForTab = (tab: TabType) => {
    switch (tab) {
      case "now-playing":
        return nowPlayingMovies;
      case "hollywood":
        return hollywoodMovies;
      case "bollywood":
        return bollywoodMovies;
      default:
        return [];
    }
  };

  const isLoading =
    (activeTab === "now-playing" && isNowPlayingLoading || isNowPlayingFetching) ||
    (activeTab === "hollywood" && isHollywoodLoading || isHollywoodFetching) ||
    (activeTab === "bollywood" && isHindiLoading || isHindiFetching);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const currentMovies = getMoviesForTab(activeTab);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3
            className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #E50914, #8b0000)', WebkitBackgroundClip: 'text' }}
          >
            Browse Movies
          </h3>
          <p className="text-muted-foreground text-lg">Discover amazing films from around the world</p>
        </div>

        {/* Premium Tabs Design */}
        <div className="relative">
          {/* Background decoration */}
          <div
            className="absolute inset-0 rounded-2xl blur-xl"
            style={{ background: 'linear-gradient(to right, rgba(229, 9, 20, 0.1), rgba(0, 0, 0, 0), rgba(229, 9, 20, 0.1))' }}
          />

          <div className="relative grid grid-cols-3 gap-4 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative group px-6 py-4 rounded-xl font-semibold transition-all duration-500 overflow-hidden",
                  activeTab === tab.id
                    ? "text-white shadow-2xl shadow-red-900/30 scale-105"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:scale-102"
                )}
                style={activeTab === tab.id ? { background: 'linear-gradient(to right, #E50914, #8b0000)' } : {}}
              >
                {/* Animated background for active tab */}
                {activeTab === tab.id && (
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{ background: 'linear-gradient(to right, rgba(255, 255, 255, 0.1), transparent)' }}
                  />
                )}

                {/* Tab content */}
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    {tab.id === "now-playing" && (
                      <Clapperboard className="w-5 h-5 text-white" />
                    )}
                    {tab.id === "hollywood" && (
                      <Sparkles className="w-5 h-5 text-white" />
                    )}
                    {tab.id === "bollywood" && (
                      <Theater className="w-5 h-5 text-white" />
                    )}
                    <span className="text-base">{tab.label}</span>
                  </div>

                  {/* Movie count with enhanced styling */}
                  <div className={`
                    flex items-center justify-center gap-1 text-sm font-medium
                    ${activeTab === tab.id
                      ? "text-white/90"
                      : "text-zinc-500"
                    }
                  `}>
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-bold
                      ${activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-zinc-800 text-zinc-400"
                      }
                    `}>
                      {tab.count}
                    </span>
                    <span className="text-xs">movies</span>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </button>
            ))}
          </div>

          <div className="flex justify-center mt-4">
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: activeTab === "now-playing" ? "120px" :
                  activeTab === "hollywood" ? "110px" : "100px",
                background: 'linear-gradient(to right, #E50914, #8b0000)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Movies Grid with enhanced styling */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold text-zinc-300">
              {tabs.find(t => t.id === activeTab)?.label} Movies
            </h4>
            <span className="text-sm text-zinc-500">
              {currentMovies.length} results
            </span>
          </div>

          {/* Enhanced movie grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentMovies.map((movie) => (
              <div
                key={movie.id}
                className="group relative rounded-2xl overflow-hidden bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20"
              >
                <div className="aspect-2/3 relative">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          // Create placeholder element
                          const placeholder = document.createElement('div');
                          placeholder.className = 'w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-dashed border-white/20';
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

                  {/* Enhanced overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to bottom right, rgba(229, 9, 20, 0.2), transparent)' }}
                    />
                  </div>

                  <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full backdrop-blur-sm">
                          {movie.genres[0] || "Drama"}
                        </span>
                        <span className="text-primary text-sm font-bold flex items-center gap-1">
                          <Star className="w-4 h-4 fill-primary" />
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                      <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-lg">
                        <Link href={`/booking/${movie.id}`}>Book Tickets</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3 bg-zinc-900/30">
                  <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{new Date(movie.release_date).getFullYear()}</span>
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="w-4 h-4 fill-primary" />
                      <span className="font-medium">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
