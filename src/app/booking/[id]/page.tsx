"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useGetMovieByIdQuery,
  useGetBookingsByMovieAndTimeQuery,
  useCreateBookingMutation,
  useGetTimeSlotsByMovieQuery,
} from "@/store/moviesApi";
import { ShimmerText } from "@/components/ui/shimmer";
import UnauthorizedBookingModal from "@/components/UnauthorizedBookingModal";
import { RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";
import { formatDate } from "@/helpers/HelperFunction";
import toast from "react-hot-toast";
import moment from "moment";
import { getScreenSeatLayout } from "@/data/screenLayouts";

interface Seat {
  id: string;
  row: string;
  number: number;
  type: "STANDARD" | "PREMIUM" | "VIP";
  price: number;
  isBooked: boolean;
}

const SEAT_TYPES = {
  VIP: {
    label: "VIP",
    price: 500,
    color: "bg-purple-600",
    hover: "hover:bg-purple-500",
  },
  PREMIUM: {
    label: "Premium",
    price: 300,
    color: "bg-blue-600",
    hover: "hover:bg-blue-500",
  },
  STANDARD: {
    label: "Standard",
    price: 150,
    color: "bg-zinc-600",
    hover: "hover:bg-zinc-500",
  },
};

const generateSeats = (screenType: string): Seat[] => {
  const seats: Seat[] = [];
  const layout = getScreenSeatLayout(screenType);
  const seatsPerRow = layout.blockSizes.reduce((sum, size) => sum + size, 0);

  layout.rows.forEach((row, rowIndex) => {
    const totalRows = layout.rows.length;
    const vipStartIndex = totalRows - layout.vipRows;
    const premiumStartIndex = vipStartIndex - layout.premiumRows;
    const type: "STANDARD" | "PREMIUM" | "VIP" =
      rowIndex >= vipStartIndex
        ? "VIP"
        : rowIndex >= premiumStartIndex
          ? "PREMIUM"
          : "STANDARD";
    for (let i = 1; i <= seatsPerRow; i++) {
      // Simple deterministic logic for demo purposes to avoid hydration mismatch
      const isReserved = false;

      seats.push({
        id: `${row}${i}`,
        row,
        number: i,
        type,
        price: SEAT_TYPES[type].price,
        isBooked: isReserved,
      });
    }
  });
  return seats;
};

export default function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [movieId, setMovieId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get auth state
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );

  // Use RTK Query to fetch movie details
  const { data: movie } = useGetMovieByIdQuery(movieId ?? 0, {
    skip: !movieId,
  });

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const slotId = searchParams.get("slotId");

  const { data: dayTimeSlots = [] } = useGetTimeSlotsByMovieQuery(
    {
      tmdb_movie_id: movieId ?? 0,
      date_from: dateParam ?? undefined,
      date_to: dateParam ?? undefined,
    },
    { skip: !movieId || !dateParam },
  );

  const selectedTimeSlot = useMemo(
    () => dayTimeSlots.find((slot) => String(slot.id) === String(slotId)),
    [dayTimeSlots, slotId],
  );
  const selectedScreenType = selectedTimeSlot?.screen_type ?? "2D";
  const seatLayout = useMemo(
    () => getScreenSeatLayout(selectedScreenType),
    [selectedScreenType],
  );
  const aisleBreakSeatNumbers = useMemo(() => {
    const breaks: number[] = [];
    let running = 0;
    seatLayout.blockSizes.slice(0, -1).forEach((size) => {
      running += size;
      breaks.push(running);
    });
    return breaks;
  }, [seatLayout]);
  const baseSeats = useMemo(
    () => generateSeats(selectedScreenType),
    [selectedScreenType],
  );

  // Fetch already booked seats
  const { data: remoteBookings = [] } = useGetBookingsByMovieAndTimeQuery(
    {
      tmdb_movie_id: movieId ?? 0,
      show_date: dateParam ?? "",
      show_time: timeParam ?? "",
    },
    { skip: !movieId || !dateParam || !timeParam },
  );

  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();

  const bookedSeatIds = remoteBookings.map((b) => b.seat_id);

  // Derive seats with booking status
  const seats = useMemo(
    () =>
      baseSeats.map((seat) => ({
        ...seat,
        isBooked: bookedSeatIds.includes(seat.id),
      })),
    [baseSeats, bookedSeatIds],
  );

  // Extract movie ID from params
  useEffect(() => {
    params.then((p) => setMovieId(parseInt(p.id)));
  }, [params]);

  const movieTitle = movie?.title || <ShimmerText className="h-8 w-64" />;
  const theaterName = "Midnight Cinemas: Screen 1";

  // Get date and time from specific query params

  const formattedDate = dateParam
    ? formatDate(dateParam, "ddd, MMM D")
    : "Today";

  const formattedTime = timeParam
    ? moment(timeParam, ["HH:mm", "HH:mm:ss"]).format("hh:mm A")
    : "09:30 PM";

  const showTime = `${formattedDate}, ${formattedTime}`;

  const handleSeatClick = (seatId: string, isBooked: boolean) => {
    if (isBooked) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId],
    );
  };

  const totalPrice = selectedSeats.reduce((acc, seatId) => {
    const seat = baseSeats.find((s) => s.id === seatId);
    return acc + (seat?.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Unauthorized Booking Modal */}
      <UnauthorizedBookingModal
        show={showAuthModal}
        close={() => setShowAuthModal(false)}
      />
      {/* Header */}
      <header className="p-4 border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-black/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={movieId ? `/movie-details/${movieId}` : "/movies"}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold leading-tight">{movieTitle}</h1>
              <p className="text-sm text-zinc-400">
                {theaterName} | {showTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-zinc-300">
                Fast Booking Active
              </span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/15 bg-white/5 hover:bg-white/10"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 flex flex-col items-center relative pb-64">
        {/* Ambient background glow from screen */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-primary/5 blur-[150px] -z-10 rounded-full" />

        {/* Cinematic Screen Representation */}
        <div className="w-full max-w-4xl mb-24 relative perspective-[1000px]">
          {/* The Screen Arc */}
          <div className="relative h-12 w-full overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110%] h-[300px] border-t-[6px] border-primary/40 rounded-[100%] shadow-[0_-20px_50px_-10px_rgba(229,9,20,0.5)]" />
          </div>

          {/* Screen Light Casting */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-gradient-to-b from-primary/20 to-transparent opacity-40 blur-2xl pointer-events-none" />

          <div className="text-center mt-6">
            <span className="text-[10px] tracking-[0.8em] uppercase font-black text-zinc-600 animate-pulse">
              Screen This Way
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-16 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-zinc-700/50 border border-white/10" />
            <span className="text-xs font-medium text-zinc-400">Available</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-primary shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
            <span className="text-xs font-medium text-white">Selected</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-5 h-5 rounded-md bg-red-950/80 border border-red-500/50 flex items-center justify-center">
              <X className="w-3 h-3 text-red-300" />
            </div>
            <span className="text-xs font-medium text-red-300">Sold Out</span>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="w-full max-w-5xl mx-auto overflow-x-auto py-12 pb-24 custom-scrollbar">
          <div className="min-w-[600px] flex flex-col items-center gap-4">
            {seatLayout.rows.map((row, rowIndex) => (
              <div
                key={row}
                className={cn(
                  "flex items-center gap-6",
                  rowIndex === 1 || rowIndex === 4 ? "mb-8" : "", // Category separators
                )}
              >
                <div className="w-6 text-xs font-black text-zinc-700 select-none">
                  {row}
                </div>

                <div className="flex gap-3">
                  {seats
                    .filter((s) => s.row === row)
                    .map((seat) => {
                      const isSelected = selectedSeats.includes(seat.id);
                      const isBooked = seat.isBooked;

                      const marginClass = aisleBreakSeatNumbers.includes(
                        seat.number,
                      )
                        ? "mr-10"
                        : "";

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seat.id, isBooked)}
                          className={cn(
                            "relative group w-9 h-9 md:w-10 md:h-10 rounded-xl transition-all duration-300",
                            marginClass,
                            isBooked
                              ? "bg-red-950/80 cursor-not-allowed border border-red-500/50 opacity-90 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                              : isSelected
                                ? "bg-primary text-white scale-110 shadow-[0_0_25px_rgba(229,9,20,0.6)] ring-2 ring-primary/50 ring-offset-4 ring-offset-black z-10"
                                : cn(
                                    "bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:-translate-y-1",
                                    seat.type === "VIP"
                                      ? "border-purple-500/30"
                                      : seat.type === "PREMIUM"
                                        ? "border-blue-500/30"
                                        : "",
                                  ),
                          )}
                        >
                          {/* Sold Out Visual Indicator */}
                          {isBooked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <X className="w-5 h-5 text-red-300 opacity-90" />
                            </div>
                          )}

                          {/* Seat Number Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 rounded text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 whitespace-nowrap z-[100]">
                            {seat.type} {row}
                            {seat.number} • ₹{seat.price}
                          </div>

                          {/* Aesthetic chair details */}
                          <div
                            className={cn(
                              "absolute inset-[2px] rounded-lg flex items-center justify-center overflow-hidden",
                              isSelected ? "bg-primary" : "bg-transparent",
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px] font-bold transition-opacity",
                                isSelected
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-40",
                              )}
                            >
                              {seat.number}
                            </span>
                          </div>

                          {/* Chair "Legs/Base" for realistic look */}
                          <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-current opacity-20" />
                        </button>
                      );
                    })}
                </div>

                <div className="w-6 text-xs font-black text-zinc-700 select-none">
                  {row}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Checkout Bar Overlay */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 transform",
          selectedSeats.length > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="bg-zinc-900/95 backdrop-blur-2xl border-t border-white/10 p-5 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-6 px-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-8">
            <div className="space-y-1">
              <p className="text-[10px] tracking-widest uppercase font-bold text-zinc-500">
                Tickets
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.sort().map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-primary/20 text-primary text-xs font-black rounded-lg border border-primary/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-[1px] h-10 bg-white/10 hidden md:block" />

            <div className="space-y-0">
              <p className="text-[10px] tracking-widest uppercase font-bold text-zinc-500">
                Payable Amount
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">
                  ₹{totalPrice}
                </span>
                <span className="text-zinc-500 text-xs font-medium">
                  incl. taxes
                </span>
              </div>
            </div>
          </div>

          <Button
            className="w-full md:w-auto px-10 h-14 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-[0_10px_30px_-10px_rgba(229,9,20,0.5)] group disabled:opacity-50"
            disabled={isBooking}
            onClick={async () => {
              if (!isAuthenticated) {
                setShowAuthModal(true);
                return;
              }

              try {
                const response = await createBooking({
                  user_id: user?.id,
                  tmdb_movie_id: movieId!,
                  show_date: dateParam!,
                  show_time: timeParam!,
                  timeslot_id: slotId!,
                  seat_ids: selectedSeats,
                  amount: totalPrice,
                }).unwrap();

                const bookingIds = response
                  .map((booking) => booking.id)
                  .join(",");
                const query = new URLSearchParams({
                  movieId: String(movieId!),
                  date: dateParam!,
                  time: timeParam!,
                  slotId: slotId!,
                  seats: selectedSeats.join(","),
                  amount: String(totalPrice),
                  bookingIds,
                });
                router.push(`/booking/summary?${query.toString()}`);
              } catch (err) {
                console.error("Seat confirmation failed:", err);
                toast.error("Unable to confirm seats");
              }
            }}
          >
            <span className="flex items-center gap-3">
              {isBooking ? "Processing..." : "Confirm Seats"}
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/40 transition-colors">
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </div>
            </span>
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
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
      `}</style>
    </div>
  );
}
