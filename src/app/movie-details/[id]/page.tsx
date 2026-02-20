"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, Users, Calendar, Star } from "lucide-react";
import { useGetMovieDetailsExtendedQuery } from "@/store/moviesApi";
import { Shimmer, ShimmerText, ShimmerCard } from "@/components/ui/shimmer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import ProfileIcon from "@/components/ProfileIcon";

interface TimeSlot {
  id: string;
  time: string;
  availableSeats: number;
  totalSeats: number;
  screenType: string;
  screenIcon: string;
}

interface DateSlot {
  date: Date;
  dayName: string;
  dayNumber: number;
  month: string;
  isToday: boolean;
}

// Mock time slots data - can be modified based on date
const generateTimeSlots = (date: Date): TimeSlot[] => {
  // You can customize time slots based on the date here
  const baseSlots = [
    {
      id: "1",
      time: "10:00 AM",
      availableSeats: 12,
      totalSeats: 100,
      screenType: "Standard (2D)",
      screenIcon: "",
    },
    {
      id: "2",
      time: "01:30 PM",
      availableSeats: 45,
      totalSeats: 100,
      screenType: "3D Screen",
      screenIcon: "",
    },
    {
      id: "3",
      time: "05:00 PM",
      availableSeats: 8,
      totalSeats: 100,
      screenType: "IMAX",
      screenIcon: "",
    },
    {
      id: "4",
      time: "08:30 PM",
      availableSeats: 2,
      totalSeats: 100,
      screenType: "4DX",
      screenIcon: "",
    },
    {
      id: "5",
      time: "11:00 PM",
      availableSeats: 67,
      totalSeats: 100,
      screenType: "Dolby Cinema",
      screenIcon: "",
    },
  ];

  // Randomize availability slightly based on date for demo
  const dateSeed = date.getDate();
  return baseSlots.map((slot, index) => ({
    ...slot,
    availableSeats: Math.max(
      0,
      slot.availableSeats + Math.floor((dateSeed + index) % 20) - 10,
    ),
  }));
};

// Generate date slots for next 7 days
const generateDateSlots = (): DateSlot[] => {
  const dates: DateSlot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    dates.push({
      date,
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      isToday: i === 0,
    });
  }

  return dates;
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null,
  );
  const [isDateTransitioning, setIsDateTransitioning] = useState(false);

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
      setTimeSlots(generateTimeSlots(selectedDate));
    });
  }, [params, selectedDate]);

  const handleTimeSlotClick = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    const formattedDate = selectedDate.toISOString().split("T")[0];
    router.push(
      `/booking/${movieId}?date=${formattedDate}&time=${slot.time}&slotId=${slot.id}&screen=${slot.screenType}`,
    );
  };

  const handleDateSelect = (dateSlot: DateSlot) => {
    setIsDateTransitioning(true);
    setTimeout(() => {
      setSelectedDate(dateSlot.date);
      setSelectedTimeSlot(null);
      setIsDateTransitioning(false);
    }, 150);
  };

  const getAvailabilityStatus = (availableSeats: number) => {
    if (availableSeats === 0)
      return { text: "Sold Out", color: "text-red-500" };
    if (availableSeats <= 10)
      return { text: "Few Left", color: "text-orange-500" };
    return { text: "Available", color: "text-green-500" };
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="p-4 border-b border-border backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">
              {movie?.title || <ShimmerText className="h-6 w-48" />}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ProfileIcon />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-8">
            {/* Movie Details Shimmer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Movie Poster and Info Shimmer */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                  <Shimmer className="aspect-video w-full" />
                  <div className="p-6 space-y-4">
                    <ShimmerText className="h-8 w-3/4" />
                    <div className="flex items-center gap-4">
                      <Shimmer className="h-6 w-20 rounded-full" />
                      <Shimmer className="h-6 w-16 rounded-full" />
                      <Shimmer className="h-6 w-24 rounded-full" />
                    </div>
                    <ShimmerText lines={3} className="w-full" />
                  </div>
                </div>
              </div>

              {/* Cast Section Shimmer */}
              <div className="space-y-4">
                <Shimmer className="h-6 w-32" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
                    >
                      <Shimmer className="h-24 w-full" />
                      <div className="p-3 space-y-2">
                        <Shimmer className="h-4 w-20" />
                        <Shimmer className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Selector Shimmer */}
            <div className="space-y-4">
              <Shimmer className="h-6 w-32" />
              <div className="flex gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Shimmer key={i} className="h-20 w-20 rounded-xl" />
                ))}
              </div>
            </div>

            {/* Time Slots Shimmer */}
            <div className="space-y-4">
              <Shimmer className="h-6 w-32" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3 min-h-[180px]"
                  >
                    <div className="flex flex-col items-center space-y-1 pb-2 border-b border-zinc-700/50">
                      <Shimmer className="h-8 w-8 rounded-lg" />
                      <Shimmer className="h-3 w-16" />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Shimmer className="h-4 w-4 rounded" />
                      <Shimmer className="h-6 w-16 rounded" />
                    </div>
                    <div className="space-y-2">
                      <Shimmer className="h-3 w-20 rounded" />
                      <Shimmer className="h-3 w-16 rounded" />
                    </div>
                    <Shimmer className="h-1 w-full rounded-full mt-auto" />
                  </div>
                ))}
              </div>
            </div>
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
                    movie.cast.slice(0, 6).map((actor) => (
                      <div
                        key={actor.id}
                        className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        <div className="w-full h-24 bg-zinc-800 overflow-hidden flex items-center justify-center">
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
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <ShimmerCard key={i} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Slots Section */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Select Show Time</h2>
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-6 overflow-x-hidden">
                {/* Date Selector */}
                <div className="space-y-4 w-full">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Select Date</span>
                  </div>
                  <div className="relative w-full">
                    <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-3 px-1 -mx-1 custom-scrollbar-horizontal">
                      <div className="flex gap-3 min-w-max p-5">
                        {generateDateSlots().map((dateSlot, index) => {
                          const isSelected =
                            selectedDate.toDateString() ===
                            dateSlot.date.toDateString();
                          return (
                            <button
                              key={dateSlot.date.toISOString()}
                              onClick={() => handleDateSelect(dateSlot)}
                              className={cn(
                                "flex flex-col items-center p-3 rounded-xl border transition-all duration-300 min-w-[80px] transform",
                                "hover:scale-105 hover:-translate-y-1",
                                isSelected
                                  ? "border-primary bg-primary/20 text-white scale-105 -translate-y-1 shadow-lg shadow-primary/30"
                                  : "border-zinc-700 bg-zinc-800/50 hover:border-primary/50 hover:bg-primary/10",
                                dateSlot.isToday &&
                                  !isSelected &&
                                  "ring-2 ring-primary/30",
                                "animate-in fade-in slide-in-from-bottom-2",
                              )}
                              style={{
                                animationDelay: `${index * 50}ms`,
                                animationDuration: "400ms",
                                animationFillMode: "both",
                              }}
                            >
                              <span className="text-xs font-medium text-zinc-400 mb-1 transition-colors duration-200">
                                {dateSlot.dayName}
                              </span>
                              <span className="text-lg font-bold mb-1 transition-transform duration-200 group-hover:scale-110">
                                {dateSlot.dayNumber}
                              </span>
                              <span className="text-xs text-zinc-400 transition-colors duration-200">
                                {dateSlot.month}
                              </span>
                              {dateSlot.isToday && (
                                <span className="text-xs text-primary font-semibold mt-1 animate-pulse">
                                  Today
                                </span>
                              )}
                              {/* Selection indicator */}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-in zoom-in-95 duration-300">
                                  <div className="w-full h-full bg-primary rounded-full animate-ping absolute" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Date Display */}
                <div
                  className={cn(
                    "flex items-center gap-2 pb-4 border-b border-zinc-700 transition-all duration-300",
                    isDateTransitioning && "opacity-50 scale-95",
                  )}
                >
                  <Calendar
                    className={cn(
                      "w-5 h-5 text-primary transition-transform duration-300",
                      isDateTransitioning && "animate-spin",
                    )}
                  />
                  <span className="font-semibold transition-all duration-300">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-sm text-zinc-400 ml-auto transition-all duration-300">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Time Slots Grid */}
                <div
                  className={cn(
                    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 transition-all duration-500",
                    isDateTransitioning && "opacity-0 scale-95",
                  )}
                >
                  {timeSlots.map((slot, index) => {
                    const availability = getAvailabilityStatus(
                      slot.availableSeats,
                    );
                    const isAvailable = slot.availableSeats > 0;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => isAvailable && handleTimeSlotClick(slot)}
                        disabled={!isAvailable}
                        className={cn(
                          "relative p-4 rounded-xl border transition-all duration-300 text-center space-y-3 transform min-h-[180px]",
                          "hover:scale-105 hover:-translate-y-1",
                          isAvailable
                            ? "border-zinc-700 bg-zinc-800/50 hover:border-primary hover:bg-primary/10 cursor-pointer"
                            : "border-zinc-800 bg-zinc-900/30 cursor-not-allowed opacity-50",
                          selectedTimeSlot?.id === slot.id &&
                            "border-primary bg-primary/20 scale-105 -translate-y-1 shadow-lg shadow-primary/30",
                          "animate-in fade-in slide-in-from-bottom-2",
                        )}
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animationDuration: "500ms",
                          animationFillMode: "both",
                        }}
                      >
                        {/* Screen Type Header */}
                        <div className="flex flex-col items-center space-y-1 pb-2 border-b border-zinc-700/50">
                          <span className="text-2xl">{slot.screenIcon}</span>
                          <span className="text-xs font-semibold text-primary truncate max-w-full">
                            {slot.screenType}
                          </span>
                        </div>

                        {/* Time Display */}
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                          <span className="font-bold text-lg transition-transform duration-200 group-hover:scale-110">
                            {slot.time}
                          </span>
                        </div>

                        {/* Availability Info */}
                        <div className="space-y-2">
                          <p
                            className={cn(
                              "text-xs font-semibold transition-colors duration-200",
                              availability.color,
                            )}
                          >
                            {availability.text}
                          </p>
                          <p className="text-xs text-zinc-400 transition-opacity duration-200">
                            {slot.availableSeats} seats
                          </p>
                        </div>

                        {/* Availability indicator bar */}
                        <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden mt-auto">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-red-600 transition-all duration-700 ease-out"
                            style={{
                              width: `${(slot.availableSeats / slot.totalSeats) * 100}%`,
                            }}
                          />
                        </div>

                        {/* Selection indicator */}
                        {selectedTimeSlot?.id === slot.id && (
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-in zoom-in-95 duration-300">
                            <div className="w-full h-full bg-primary rounded-full animate-ping absolute" />
                          </div>
                        )}
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
