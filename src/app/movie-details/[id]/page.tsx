"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, Calendar, Star, Users } from "lucide-react";
import {
  useGetMovieDetailsExtendedQuery,
  useGetTimeSlotsByMovieQuery,
} from "@/store/moviesApi";
import { Shimmer, ShimmerText } from "@/components/ui/shimmer";
import { cn } from "@/lib/utils";
import { TimeSlot } from "@/lib/database/schema";
import { formatDate } from "@/helpers/HelperFunction";
import moment from "moment";

export default function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [movieId, setMovieId] = useState<number | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD in local time
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate date options with relative labels
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA");

    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString("en-CA");

      let label;
      if (i === 0) label = "Today";
      else if (i === 1) label = "Tomorrow";
      else
        label = date.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
        });

      dates.push({
        date: dateStr,
        label,
        isToday: dateStr === todayStr,
      });
    }

    return dates;
  };

  const { data: movie, isLoading } = useGetMovieDetailsExtendedQuery(
    movieId ?? 0,
    { skip: !movieId },
  );

  const { data: rawTimeSlots = [], isLoading: timeSlotsLoading } =
    useGetTimeSlotsByMovieQuery(
      {
        tmdb_movie_id: movieId ?? 0,
        date_from: selectedDate,
        date_to: selectedDate,
      },
      { skip: !movieId },
    );

  // Safely derive time slots + filter past shows on today
  const timeSlots = useMemo(() => {
    const slotsData = Array.isArray(rawTimeSlots) ? rawTimeSlots : [];
    let slots = [...slotsData];

    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA");

    if (selectedDate === todayStr) {
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      slots = slots.filter((slot: TimeSlot) => {
        const [hours, minutes] = slot.show_time.split(":").map(Number);
        return (
          hours > currentHours ||
          (hours === currentHours && minutes >= currentMinutes)
        );
      });
    }

    return slots;
  }, [rawTimeSlots, selectedDate]);

  // Parse params once
  useEffect(() => {
    params.then((p) => {
      const id = parseInt(p.id, 10);
      if (!Number.isNaN(id)) setMovieId(id);
    });
  }, [params]);

  // Close date picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement)?.closest(".date-picker-dropdown")) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTimeSlotClick = (slot: TimeSlot) => {
    if (slot.available_seats > 0) {
      const queryParams = new URLSearchParams({
        date: selectedDate,
        time: slot.show_time,
        slotId: slot.id,
      }).toString();
      router.push(`/booking/${movieId}?${queryParams}`);
    }
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
          <div className="space-y-12">
            {/* Trailer Section Shimmer */}
            <div className="space-y-4">
              <Shimmer className="h-8 w-32" />
              <Shimmer className="w-full aspect-video rounded-2xl" />
            </div>

            {/* Related Videos Shimmer */}
            <div className="space-y-4">
              <Shimmer className="h-8 w-48" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Shimmer key={i} className="shrink-0 w-40 h-28 rounded-lg" />
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* About Shimmer */}
              <div className="md:col-span-2 space-y-4">
                <Shimmer className="h-8 w-32" />
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-6">
                  <div className="space-y-2">
                    <Shimmer className="h-4 w-full" />
                    <Shimmer className="h-4 w-5/6" />
                    <Shimmer className="h-4 w-4/6" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-700">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <Shimmer className="h-3 w-16" />
                        <Shimmer className="h-5 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cast Shimmer */}
              <div className="space-y-4">
                <Shimmer className="h-8 w-24" />
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
                    >
                      <Shimmer className="w-full h-56" />
                      <div className="p-3 space-y-2">
                        <Shimmer className="h-4 w-3/4" />
                        <Shimmer className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Showtimes Shimmer */}
            <div className="space-y-4">
              <Shimmer className="h-8 w-48" />
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-zinc-700">
                  <Shimmer className="w-5 h-5" />
                  <Shimmer className="h-6 w-32" />
                </div>

                {/* Date Shimmer */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pb-4">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Shimmer key={i} className="h-20 rounded-xl w-full" />
                  ))}
                </div>

                {/* Time Slots Shimmer */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-2"
                    >
                      <div className="flex justify-center items-center gap-2">
                        <Shimmer className="w-4 h-4" />
                        <Shimmer className="h-6 w-16" />
                      </div>
                      <Shimmer className="h-4 w-20 mx-auto" />
                      <Shimmer className="h-3 w-12 mx-auto" />
                      <Shimmer className="h-1 w-full mt-2 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : movie ? (
          <div className="space-y-12">
            {/* Trailer Section */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Trailer</h2>
              <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                {(selectedVideoUrl || movie?.trailer_url)?.includes(
                  "youtube",
                ) ? (
                  <iframe
                    className="w-full h-full rounded-xl"
                    src={(selectedVideoUrl || movie?.trailer_url)!}
                    title="Movie Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary mb-4">
                      <svg
                        className="w-8 h-8 text-primary ml-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                    <p>Trailer not available</p>
                  </div>
                )}
              </div>
            </section>

            {/* Related Videos */}
            {movie?.videos?.length ? (
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
                        className="w-full h-full relative bg-cover bg-center"
                        style={{
                          backgroundImage: movie.backdrop_url
                            ? `url(${movie.backdrop_url})`
                            : undefined,
                          backgroundColor: "#18181b",
                        }}
                      >
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center group-hover:bg-primary">
                            <svg
                              className="w-6 h-6 text-white ml-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs font-semibold line-clamp-2">
                            {video.name}
                          </p>
                          <p className="text-xs text-zinc-300">{video.type}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {/* About + Cast */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* About */}
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold">About</h2>
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-6">
                  <p className="text-zinc-300 leading-relaxed">
                    {movie.overview || "No description available."}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-700">
                    <div>
                      <p className="text-zinc-500 text-sm">Release Date</p>
                      <p className="font-semibold">
                        {movie.release_date
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
                    <div>
                      <p className="text-zinc-500 text-sm">Rating</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="font-semibold">
                          {movie.vote_average.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Duration</p>
                      <p className="font-semibold">
                        {movie.runtime
                          ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Language</p>
                      <p className="font-semibold">English</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Genre</p>
                      <p className="font-semibold text-sm">
                        {movie.genres?.slice(0, 2).join(", ") || "Drama"}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Director</p>
                      <p className="font-semibold">
                        {movie.director?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cast */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Cast</h2>
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {movie.cast?.length ? (
                    movie.cast.map((actor) => (
                      <div
                        key={actor.id}
                        className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        <div className="w-full h-56 bg-zinc-800 flex items-center justify-center">
                          {actor.profile_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={actor.profile_url}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                              onError={(e) =>
                                (e.currentTarget.style.display = "none")
                              }
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

            {/* Showtimes */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Select Show Time</h2>
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-zinc-700">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Select Date</span>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 pb-4">
                  {generateDateOptions().map((dateOption) => (
                    <button
                      key={dateOption.date}
                      onClick={() => setSelectedDate(dateOption.date)}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all duration-300 cursor-pointer",
                        dateOption.date === selectedDate
                          ? "border-primary bg-primary/20 text-primary scale-105 shadow-lg shadow-primary/20"
                          : "border-zinc-700 bg-zinc-800/50 hover:border-primary hover:bg-primary/10 hover:scale-105",
                      )}
                    >
                      <div className="text-sm font-semibold">
                        {dateOption.label}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {formatDate(dateOption.date, "ddd, MMM D")}
                      </div>
                      {dateOption.isToday && (
                        <div className="text-xs text-primary font-medium">
                          Today
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {timeSlotsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-2"
                      >
                        <Shimmer className="h-6 w-16 mx-auto" />
                        <Shimmer className="h-4 w-3/4 mx-auto" />
                        <Shimmer className="h-3 w-1/2 mx-auto" />
                      </div>
                    ))
                  ) : timeSlots.length > 0 ? (
                    timeSlots.map((slot) => {
                      const availability = getAvailabilityStatus(
                        slot.available_seats,
                      );
                      const isAvailable = slot.available_seats > 0;

                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleTimeSlotClick(slot)}
                          disabled={!isAvailable}
                          className={cn(
                            "p-4 rounded-xl border text-center space-y-2 transition-all duration-300",
                            isAvailable
                              ? "border-zinc-700 bg-zinc-800/50 hover:border-primary hover:bg-primary/10 hover:scale-105 cursor-pointer"
                              : "border-zinc-800 bg-zinc-900/30 cursor-not-allowed opacity-50",
                          )}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-bold text-lg">
                              {moment(`2000-01-01T${slot.show_time}`).format(
                                "hh:mm A",
                              )}
                            </span>
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
                            {slot.available_seats} seats
                          </p>
                          <p className="text-xs text-zinc-500 font-medium">
                            {slot.screen_type}
                          </p>

                          <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-red-600"
                              style={{
                                width: `${(slot.available_seats / slot.total_seats) * 100}%`,
                              }}
                            />
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-zinc-400">
                      No show times available for this date
                    </div>
                  )}
                </div>

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
          <div className="text-center py-12 text-zinc-400">
            Unable to load movie details
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
