/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Ticket,
  Calendar,
  Clock,
  CreditCard,
  ChevronRight,
  Armchair as SeatIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetUserBookingsQuery,
  useGetMovieByIdQuery,
  useCreateCheckoutSessionMutation,
  useCancelBookingsMutation,
} from "@/store/moviesApi";
import { RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";
import { Shimmer } from "@/components/ui/shimmer";
import moment from "moment";
import { BookingStatus } from "@/lib/database/schema";
import toast from "react-hot-toast";

// Define the structure of a single booking item from the API
interface BookingItem {
  id: number;
  user_id?: string;
  tmdb_movie_id: number;
  show_date: string;
  show_time: string;
  seat_id?: string;
  seat_ids?: string[];
  price: number | string;
  status: number; // Numeric status 1-6
  timeslot_id: string;
  stripe_payment_id?: string | null;
  stripe_session_id?: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

// Define the structure of a grouped transaction
interface GroupedBookingTransaction extends Omit<
  BookingItem,
  "seat_id" | "price"
> {
  seats: string[];
  bookingIds: number[];
  totalAmount: number;
  movie_title?: string;
}

const sortSeatLabels = (seats: string[]) => {
  return [...new Set(seats)].sort((a, b) => {
    const aMatch = a.match(/^([A-Za-z]+)(\d+)$/);
    const bMatch = b.match(/^([A-Za-z]+)(\d+)$/);
    if (!aMatch || !bMatch) return a.localeCompare(b);

    const [, aRow, aNum] = aMatch;
    const [, bRow, bNum] = bMatch;
    if (aRow !== bRow) return aRow.localeCompare(bRow);
    return Number(aNum) - Number(bNum);
  });
};

const getSeatPreview = (seats: string[], limit: number = 4) => {
  const sorted = sortSeatLabels(seats);
  const previewSeats = sorted.slice(0, limit);
  const remainingCount = Math.max(0, sorted.length - previewSeats.length);
  return {
    sorted,
    previewSeats,
    remainingCount,
  };
};

const getStatusDetails = (status: number) => {
  switch (status) {
    case BookingStatus.PENDING_PAYMENT:
      return {
        label: "Pending Payment",
        icon: Timer,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    case BookingStatus.CONFIRMED:
      return {
        label: "Confirmed",
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    case BookingStatus.FAILED:
      return {
        label: "Payment Failed",
        icon: XCircle,
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
      };
    case BookingStatus.EXPIRED:
      return {
        label: "Expired",
        icon: AlertCircle,
        color: "text-red-300",
        bg: "bg-red-500/20",
        border: "border-red-500/35",
      };
    case BookingStatus.CANCELLED:
      return {
        label: "Cancelled",
        icon: XCircle,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
      };
    case BookingStatus.REFUNDED:
      return {
        label: "Cancelled",
        icon: XCircle,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
      };
    default:
      return {
        label: "Unknown",
        icon: AlertCircle,
        color: "text-zinc-500",
        bg: "bg-zinc-500/10",
        border: "border-zinc-500/20",
      };
  }
};

const MovieDataGate = ({
  movieId,
  onStateChange,
  children,
}: {
  movieId: number;
  onStateChange?: (
    movieId: number,
    state: "loading" | "success" | "error",
  ) => void;
  children: (payload: {
    movie:
      | {
          title?: string;
          poster_url?: string | null;
        }
      | undefined;
    isLoading: boolean;
    isError: boolean;
  }) => React.ReactNode;
}) => {
  const { data: movie, isLoading, isError } = useGetMovieByIdQuery(movieId);
  React.useEffect(() => {
    if (!onStateChange) return;
    if (isError) {
      onStateChange(movieId, "error");
      return;
    }
    if (isLoading) {
      onStateChange(movieId, "loading");
      return;
    }
    onStateChange(movieId, "success");
  }, [isError, isLoading, movieId, onStateChange]);

  return <>{children({ movie, isLoading, isError })}</>;
};

const EmptyBookingsState = ({ onExplore }: { onExplore: () => void }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
    <div className="w-24 h-24 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
      <Ticket className="w-10 h-10 text-zinc-700" />
    </div>
    <div className="space-y-2">
      <h3 className="text-2xl font-black">No Bookings Yet</h3>
      <p className="text-zinc-500 max-w-sm mx-auto font-medium">
        Your cinematic journey hasn&apos;t started. Experience the magic of
        movies today.
      </p>
    </div>
    <button
      onClick={onExplore}
      className="mt-4 px-10 h-14 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform cursor-pointer"
    >
      Explore Movies
    </button>
  </div>
);

export default function TransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );

  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useGetUserBookingsQuery(user?.id || "", {
    skip: !user?.id || !isAuthenticated,
  });

  const [createCheckoutSession, { isLoading: isPaying }] =
    useCreateCheckoutSessionMutation();
  const [cancelBookings, { isLoading: isCancelling }] =
    useCancelBookingsMutation();
  const [cancelTarget, setCancelTarget] =
    React.useState<GroupedBookingTransaction | null>(null);
  const [seatDialogTarget, setSeatDialogTarget] =
    React.useState<GroupedBookingTransaction | null>(null);
  const [movieLoadStates, setMovieLoadStates] = React.useState<
    Record<number, "loading" | "success" | "error">
  >({});

  const handlePayNow = async (tx: GroupedBookingTransaction) => {
    try {
      const result = await createCheckoutSession({
        user_id: user?.id,
        user_email: user?.email,
        tmdb_movie_id: tx.tmdb_movie_id,
        movie_title: tx.movie_title || "Movie Booking",
        show_date: tx.show_date,
        show_time: tx.show_time,
        timeslot_id: tx.timeslot_id,
        seat_ids: tx.seats,
        amount: tx.totalAmount,
        booking_ids: tx.bookingIds,
      }).unwrap();

      if (result.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Failed to initiate payment. Please try again.");
    }
  };

  const handleCancelBooking = async (tx: GroupedBookingTransaction) => {
    if (!user?.id || tx.bookingIds.length === 0) return;
    try {
      await cancelBookings({
        user_id: user.id,
        booking_ids: tx.bookingIds,
      }).unwrap();
      toast.success("Booking cancelled");
      setCancelTarget(null);
      refetch();
    } catch (error) {
      console.error("Cancel booking failed:", error);
      toast.error("Failed to cancel booking");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
        <div className="space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <CreditCard className="w-10 h-10 text-zinc-500" />
          </div>
          <h1 className="text-3xl font-black text-white">Login Required</h1>
          <p className="text-zinc-400">
            Please sign in to view your transaction history and movie bookings.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  // Group bookings by session or just list them
  const groupedBookings = (bookings as BookingItem[]).reduce<
    Record<string, GroupedBookingTransaction>
  >(
    (acc, booking) => {
      const normalizedSeats =
        Array.isArray(booking.seat_ids) && booking.seat_ids.length > 0
          ? booking.seat_ids
          : booking.seat_id
            ? [booking.seat_id]
            : [];
      const pendingGroupKey = [
        booking.user_id || "guest",
        booking.tmdb_movie_id,
        booking.show_date,
        booking.show_time,
        booking.timeslot_id,
        booking.status,
        // rows created in one insert share same timestamp in this flow
        booking.created_at,
      ].join("|");
      const key = booking.stripe_session_id || pendingGroupKey;
      if (!acc[key]) {
        const { price, ...rest } = booking;
        acc[key] = {
          ...rest,
          seats: sortSeatLabels(normalizedSeats),
          bookingIds: [booking.id],
          totalAmount: Number(price),
        };
      } else {
        acc[key].seats = sortSeatLabels([
          ...acc[key].seats,
          ...normalizedSeats,
        ]);
        if (!acc[key].bookingIds.includes(booking.id)) {
          acc[key].bookingIds.push(booking.id);
        }
        acc[key].totalAmount += Number(booking.price);
      }
      return acc;
    },
    {} as Record<string, GroupedBookingTransaction>,
  );

  const transactionList: GroupedBookingTransaction[] = Object.values(
    groupedBookings,
  ).sort(
    (a: GroupedBookingTransaction, b: GroupedBookingTransaction) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const visibleTransactionCount = transactionList.filter((tx) => {
    return movieLoadStates[tx.tmdb_movie_id] !== "error";
  }).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/movies")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black tracking-tight">
              Booking History
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                {visibleTransactionCount} Transactions
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-48 w-full rounded-[2.5rem]" />
            ))}
          </div>
        ) : transactionList.length > 0 ? (
          <div className="space-y-8">
            {transactionList.map((tx: GroupedBookingTransaction, index) => {
              const statusDetails = getStatusDetails(tx.status);
              const StatusIcon = statusDetails.icon;
              const { sorted, previewSeats, remainingCount } = getSeatPreview(
                tx.seats,
              );

              return (
                <MovieDataGate
                  key={tx.id}
                  movieId={tx.tmdb_movie_id}
                  onStateChange={(movieId, state) => {
                    setMovieLoadStates((prev) =>
                      prev[movieId] === state
                        ? prev
                        : { ...prev, [movieId]: state },
                    );
                  }}
                >
                  {({
                    movie,
                    isLoading: isMovieLoading,
                    isError: isMovieError,
                  }) =>
                    isMovieLoading ? (
                      <Shimmer className="h-[420px] w-full rounded-[2.5rem]" />
                    ) : isMovieError ? (
                      index === 0 ? (
                        <EmptyBookingsState
                          onExplore={() => router.push("/movies")}
                        />
                      ) : null
                    ) : (
                      <div className="group bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl hover:shadow-primary/5 shadow-black/50 cursor-pointer">
                        <div className="w-full md:w-48 h-64 md:h-auto shrink-0 relative overflow-hidden p-4">
                          <div className="w-full h-full relative group">
                            {movie?.poster_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={movie.poster_url}
                                alt={movie.title || "Movie"}
                                className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800 rounded-xl">
                                <Ticket className="w-8 h-8 text-zinc-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>

                        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div
                                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusDetails.bg} ${statusDetails.border} ${statusDetails.color} mb-2`}
                                >
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  <span className="text-[10px] uppercase font-black tracking-widest">
                                    {statusDetails.label}
                                  </span>
                                </div>
                                <h2 className="text-2xl font-black text-white group-hover:text-primary transition-colors duration-300">
                                  <span className="text-white font-bold">
                                    {movie?.title ||
                                      `Movie #${tx.tmdb_movie_id}`}
                                  </span>
                                </h2>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1">
                                  Total Amount
                                </p>
                                <p className="text-3xl font-black text-white">
                                  ₹{tx.totalAmount.toFixed(0)}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span className="text-[10px] uppercase font-bold tracking-widest">
                                    Date
                                  </span>
                                </div>
                                <p className="text-sm font-black">
                                  {moment(tx.show_date).format(
                                    "ddd, MMM D, YYYY",
                                  )}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="text-[10px] uppercase font-bold tracking-widest">
                                    Time
                                  </span>
                                </div>
                                <p className="text-sm font-black">
                                  {moment(`2000-01-01T${tx.show_time}`).format(
                                    "hh:mm A",
                                  )}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                  <SeatIcon className="w-3.5 h-3.5" />
                                  <span className="text-[10px] uppercase font-bold tracking-widest">
                                    Seats
                                  </span>
                                </div>
                                <div className="pt-0.5 space-y-2">
                                  <p className="text-xs text-zinc-200 font-semibold">
                                    {sorted.length} seats
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {previewSeats.map((seat) => (
                                      <span
                                        key={seat}
                                        className="px-2 py-0.5 bg-white/5 text-[10px] font-black rounded border border-white/10"
                                      >
                                        {seat}
                                      </span>
                                    ))}
                                    {remainingCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setSeatDialogTarget(tx)}
                                        className="px-2 py-0.5 bg-primary/10 text-[10px] font-black rounded border border-primary/30 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                                      >
                                        +{remainingCount} more
                                      </button>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSeatDialogTarget(tx)}
                                    className="text-[10px] uppercase font-black tracking-widest text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                  >
                                    View all
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span className="text-[10px] uppercase font-bold tracking-widest">
                                    Payment
                                  </span>
                                </div>
                                <p
                                  className="text-[10px] font-mono text-zinc-500 truncate w-32"
                                  title={
                                    tx.stripe_payment_id ||
                                    tx.stripe_session_id ||
                                    "ID_NOT_AVAILABLE"
                                  }
                                >
                                  {tx.stripe_payment_id ||
                                    tx.stripe_session_id ||
                                    "ID_NOT_AVAILABLE"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 flex items-center justify-between gap-4">
                            <p className="text-sm md:text-base font-semibold text-zinc-300">
                              Booked on{" "}
                              {moment(tx.created_at).format("MMM D, h:mm A")}
                            </p>
                            <div className="flex items-center gap-3">
                              {tx.status === BookingStatus.PENDING_PAYMENT && (
                                <button
                                  onClick={() => handlePayNow(tx)}
                                  disabled={isPaying}
                                  className="h-10 px-6 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform cursor-pointer"
                                >
                                  {isPaying ? "Processing..." : "Pay Now"}
                                </button>
                              )}
                              {(tx.status === BookingStatus.PENDING_PAYMENT ||
                                tx.status === BookingStatus.CONFIRMED) && (
                                <button
                                  onClick={() => setCancelTarget(tx)}
                                  disabled={isCancelling}
                                  className="h-10 px-6 bg-zinc-800 text-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {isCancelling
                                    ? "Cancelling..."
                                    : "Cancel Booking"}
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  router.push(
                                    `/movie-details/${tx.tmdb_movie_id}`,
                                  )
                                }
                                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              >
                                View Movie
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                </MovieDataGate>
              );
            })}
          </div>
        ) : (
          <EmptyBookingsState onExplore={() => router.push("/movies")} />
        )}
      </main>

      {cancelTarget && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Cancel Booking?</h3>
              <p className="text-sm text-zinc-400">
                This will cancel seats{" "}
                <span className="text-zinc-200 font-semibold">
                  {cancelTarget.seats.join(", ")}
                </span>
                . You can book again if seats are available.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="h-10 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(cancelTarget)}
                disabled={isCancelling}
                className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(seatDialogTarget)}
        onOpenChange={(open) => {
          if (!open) setSeatDialogTarget(null);
        }}
      >
        <DialogContent className="max-w-md bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Booked Seats</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {seatDialogTarget
                ? `${sortSeatLabels(seatDialogTarget.seats).length} seats in this booking`
                : "Seat list"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto custom-scrollbar pr-1">
            <div className="flex flex-wrap gap-2">
              {(seatDialogTarget
                ? sortSeatLabels(seatDialogTarget.seats)
                : []
              ).map((seat) => (
                <span
                  key={seat}
                  className="px-2.5 py-1 rounded-md text-xs font-black border border-white/10 bg-white/5"
                >
                  {seat}
                </span>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
