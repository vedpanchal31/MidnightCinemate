"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, Users, Calendar, Star } from "lucide-react";
import { useGetMovieDetailsExtendedQuery } from "@/store/moviesApi";
import { ShimmerText } from "@/components/ui/shimmer";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  time: string;
  availableSeats: number;
  totalSeats: number;
}

// Mock time slots data
const generateTimeSlots = (): TimeSlot[] => {
  return [
    { id: "1", time: "10:00 AM", availableSeats: 12, totalSeats: 100 },
    { id: "2", time: "01:30 PM", availableSeats: 45, totalSeats: 100 },
    { id: "3", time: "05:00 PM", availableSeats: 8, totalSeats: 100 },
    { id: "4", time: "08:30 PM", availableSeats: 2, totalSeats: 100 },
    { id: "5", time: "11:00 PM", availableSeats: 67, totalSeats: 100 },
  ];
};

export default function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [movieId, setMovieId] = useState<number | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  // Use extended query to get full movie data with cast and trailer
  const { data: movie, isLoading } = useGetMovieDetailsExtendedQuery(
    movieId ?? 0,
    {
      skip: !movieId,
    },
  );

  useEffect(() => {
    params.then((p) => {
      const id = parseInt(p.id);
      setMovieId(id);
      setTimeSlots(generateTimeSlots());
    });
  }, [params]);

  const handleTimeSlotClick = () => {
    router.push(`/booking/${movieId}`);
  };

  const getAvailabilityStatus = (availableSeats: number) => {
    if (availableSeats === 0)
      return { text: "Sold Out", color: "text-red-500" };
    if (availableSeats <= 10)
      return { text: "Few Left", color: "text-orange-500" };
    return { text: "Available", color: "text-green-500" };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="p-4 border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-black/50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">
            {movie?.title || <ShimmerText className="h-6 w-48" />}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-8">
            <ShimmerText className="h-96" />
            <ShimmerText className="h-40" />
          </div>
        ) : movie ? (
          <div className="space-y-12">
            {/* Trailer Section */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Trailer</h2>
              <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                {isLoading ? (
                  <div className="w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary animate-pulse">
                        <svg
                          className="w-8 h-8 text-primary ml-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <p className="text-zinc-400">Loading trailer...</p>
                    </div>
                  </div>
                ) : (selectedVideoUrl || movie?.trailer_url) &&
                  (selectedVideoUrl || movie?.trailer_url)?.includes(
                    "youtube",
                  ) ? (
                  <iframe
                    className="w-full h-full rounded-xl"
                    src={(selectedVideoUrl || movie?.trailer_url) as string}
                    title="Movie Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary">
                        <svg
                          className="w-8 h-8 text-primary ml-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <p className="text-zinc-400">Trailer not available</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Related Videos Section */}
            {movie?.videos && movie.videos.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">More Videos</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-horizontal">
                  {movie.videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideoUrl(video.url)}
                      className={cn(
                        "shrink-0 w-40 h-28 rounded-lg border transition-all duration-300 overflow-hidden group",
                        selectedVideoUrl === video.url
                          ? "border-primary bg-primary/10"
                          : "border-zinc-700 bg-zinc-800/50 hover:border-primary/50",
                      )}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: movie.backdrop_url
                            ? `url('${movie.backdrop_url}')`
                            : "none",
                          backgroundColor: "#18181b",
                        }}
                      >
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors">
                          <div className="w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                            <svg
                              className="w-6 h-6 text-white ml-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                        {/* Video type badge and name */}
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs font-semibold text-white line-clamp-2">
                            {video.name}
                          </p>
                          <p className="text-xs text-zinc-300">{video.type}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* About & Cast in Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* About Section */}
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold">About</h2>
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-6">
                  <p className="text-zinc-300 leading-relaxed">
                    {movie?.overview ||
                      "Movie description will appear here with details about the plot, themes, and storyline."}
                  </p>

                  {/* Movie Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-700">
                    <div className="space-y-2">
                      <p className="text-zinc-500 text-sm">Release Date</p>
                      <p className="font-semibold">
                        {movie?.release_date
                          ? new Date(movie.release_date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-500 text-sm">Rating</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <p className="font-semibold">
                          {movie?.vote_average.toFixed(1)}/10
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-500 text-sm">Duration</p>
                      <p className="font-semibold">
                        {movie?.runtime
                          ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-500 text-sm">Language</p>
                      <p className="font-semibold">English</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-500 text-sm">Genre</p>
                      <p className="font-semibold text-sm">
                        {movie?.genres && movie.genres.length > 0
                          ? movie.genres.slice(0, 2).join(", ")
                          : "Drama"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-500 text-sm">Director</p>
                      <p className="font-semibold">
                        {movie?.director?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cast Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Cast</h2>
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
                      >
                        <ShimmerText className="h-56 mb-0" />
                        <div className="p-3 space-y-2">
                          <ShimmerText className="h-4 w-20" />
                          <ShimmerText className="h-3 w-16" />
                        </div>
                      </div>
                    ))
                  ) : movie?.cast && movie.cast.length > 0 ? (
                    movie.cast.map((actor) => (
                      <div
                        key={actor.id}
                        className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        <div className="w-full h-56 bg-zinc-800 overflow-hidden flex items-center justify-center">
                          {actor.profile_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={actor.profile_url}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Users className="w-8 h-8 text-zinc-600" />
                          )}
                        </div>
                        <div className="p-3 space-y-1">
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {actor.name}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-1">
                            {actor.character}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-400 text-sm">
                      No cast information available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Time Slots Section */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Select Show Time</h2>
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-6">
                {/* Date Selector (Today) */}
                <div className="flex items-center gap-2 pb-4 border-b border-zinc-700">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Today</span>
                  <span className="text-sm text-zinc-400 ml-auto">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Time Slots Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {timeSlots.map((slot) => {
                    const availability = getAvailabilityStatus(
                      slot.availableSeats,
                    );
                    const isAvailable = slot.availableSeats > 0;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => isAvailable && handleTimeSlotClick()}
                        disabled={!isAvailable}
                        className={cn(
                          "relative p-4 rounded-xl border transition-all duration-300 text-center space-y-2",
                          isAvailable
                            ? "border-zinc-700 bg-zinc-800/50 hover:border-primary hover:bg-primary/10 hover:scale-105 cursor-pointer"
                            : "border-zinc-800 bg-zinc-900/30 cursor-not-allowed opacity-50",
                        )}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-bold text-lg">{slot.time}</span>
                        </div>
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            availability.color,
                          )}
                        >
                          {availability.text}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {slot.availableSeats} seats
                        </p>

                        {/* Availability indicator bar */}
                        <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-linear-to-r from-primary to-red-600"
                            style={{
                              width: `${(slot.availableSeats / slot.totalSeats) * 100}%`,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-6 text-sm pt-4 border-t border-zinc-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-zinc-400">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-zinc-400">Few Seats Left</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-zinc-400">Sold Out</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400">Unable to load movie details</p>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }

        .custom-scrollbar-horizontal::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
