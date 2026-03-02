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
  useGetUserTransactionsQuery,
  useGetUserRefundsQuery,
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

interface BookingItem {
  id: number;
  user_id?: string;
  tmdb_movie_id: number;
  show_date: string;
  show_time: string;
  seat_id?: string;
  seat_ids?: string[];
  price: number | string;
  status: number;
  timeslot_id: string;
  stripe_payment_id?: string | null;
  stripe_session_id?: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

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

const getStatusDetails = (status: number | string) => {
  const statusNum = typeof status === "string" ? parseInt(status, 10) : status;

  switch (statusNum) {
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
        label: "Refunded",
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

const EmptyBookingsState = ({
  onExplore,
  message,
}: {
  onExplore: () => void;
  message: string;
}) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
    <div className="w-24 h-24 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
      <Ticket className="w-10 h-10 text-zinc-700" />
    </div>
    <div className="space-y-2">
      <h3 className="text-2xl font-black">No Records Yet</h3>
      <p className="text-zinc-500 max-w-sm mx-auto font-medium">{message}</p>
    </div>
    <button
      onClick={onExplore}
      className="mt-4 px-10 h-14 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform cursor-pointer"
    >
      Explore Movies
    </button>
  </div>
);

export default function BookingsTablePage({
  mode,
  title,
}: {
  mode: "all" | "transactions" | "refunds";
  title: string;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );

  const [cancelTarget, setCancelTarget] =
    React.useState<GroupedBookingTransaction | null>(null);
  const [seatDialogTarget, setSeatDialogTarget] =
    React.useState<GroupedBookingTransaction | null>(null);
  const [movieLoadStates, setMovieLoadStates] = React.useState<
    Record<number, "loading" | "success" | "error">
  >({});

  const bookingsQuery = useGetUserBookingsQuery(user?.id ?? "", {
    skip: !user?.id || mode !== "all",
  });
  const transactionsQuery = useGetUserTransactionsQuery(user?.id ?? "", {
    skip: !user?.id || mode !== "transactions",
  });
  const refundsQuery = useGetUserRefundsQuery(user?.id ?? "", {
    skip: !user?.id || mode !== "refunds",
  });

  const bookings =
    mode === "transactions"
      ? transactionsQuery.data
      : mode === "refunds"
        ? refundsQuery.data
        : bookingsQuery.data;
  const isLoading =
    mode === "transactions"
      ? transactionsQuery.isLoading
      : mode === "refunds"
        ? refundsQuery.isLoading
        : bookingsQuery.isLoading;
  const refetch =
    mode === "transactions"
      ? transactionsQuery.refetch
      : mode === "refunds"
        ? refundsQuery.refetch
        : bookingsQuery.refetch;

  const [createCheckoutSession, { isLoading: isPaying }] =
    useCreateCheckoutSessionMutation();
  const [cancelBookings, { isLoading: isCancelling }] =
    useCancelBookingsMutation();

  const handlePayNow = async (tx: GroupedBookingTransaction) => {
    try {
      const response = await createCheckoutSession({
        booking_ids: tx.bookingIds,
        user_id: user?.id,
        user_email: user?.email,
        movie_title: tx.movie_title || "Movie Ticket",
      }).unwrap();

      if (response?.url) {
        router.push(response.url);
        return;
      }

      toast.error("Failed to start payment.");
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
            Please sign in to view your booking history and refunds.
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

  const groupedBookings = ((bookings || []) as BookingItem[]).reduce<
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

  const filteredTransactions = transactionList;

  const visibleTransactionCount = filteredTransactions.filter((tx) => {
    return movieLoadStates[tx.tmdb_movie_id] !== "error";
  }).length;

  const emptyMessage =
    mode === "refunds"
      ? "Refunds will appear here once they are processed."
      : "Your cinematic journey hasn\'t started. Book your first show.";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/movies")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                {visibleTransactionCount} Records
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl">
            <table className="min-w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Movie</th>
                  <th className="px-4 py-3 text-left">Seats</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Payment ID</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((tx, index) => {
                  const statusDetails = getStatusDetails(tx.status);
                  const StatusIcon = statusDetails.icon;
                  const { sorted, previewSeats, remainingCount } =
                    getSeatPreview(tx.seats);

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
                      {({ movie, isLoading: isMovieLoading, isError }) => (
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-xs text-zinc-500">
                              {moment(tx.show_date).format("MMM D, YYYY")}
                            </div>
                            <div className="text-sm font-semibold">
                              {moment(`2000-01-01T${tx.show_time}`).format(
                                "hh:mm A",
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">
                              {isMovieLoading
                                ? "Loading..."
                                : isError
                                  ? `Movie #${tx.tmdb_movie_id}`
                                  : movie?.title ||
                                    `Movie #${tx.tmdb_movie_id}`}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-zinc-400">
                              {sorted.length} seats
                            </div>
                            <div className="text-xs text-zinc-200">
                              {previewSeats.join(", ")}
                              {remainingCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setSeatDialogTarget(tx)}
                                  className="ml-2 text-primary hover:text-primary/80"
                                >
                                  +{remainingCount} more
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-black text-white">
                            ₹{tx.totalAmount.toFixed(0)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-widest whitespace-nowrap ${statusDetails.bg} ${statusDetails.border} ${statusDetails.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusDetails.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[10px] font-mono text-zinc-500 inline-block max-w-[140px] truncate"
                              title={
                                tx.stripe_payment_id ||
                                tx.stripe_session_id ||
                                "ID_NOT_AVAILABLE"
                              }
                            >
                              {tx.stripe_payment_id ||
                                tx.stripe_session_id ||
                                "ID_NOT_AVAILABLE"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {mode !== "transactions" &&
                                tx.status === BookingStatus.PENDING_PAYMENT && (
                                  <button
                                    onClick={() => handlePayNow(tx)}
                                    disabled={isPaying}
                                    className="h-8 px-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                  >
                                    {isPaying ? "Processing..." : "Pay"}
                                  </button>
                                )}
                              {mode !== "transactions" &&
                                (tx.status === BookingStatus.PENDING_PAYMENT ||
                                  tx.status === BookingStatus.CONFIRMED) && (
                                  <button
                                    onClick={() => setCancelTarget(tx)}
                                    disabled={isCancelling}
                                    className="h-8 px-3 bg-zinc-800 text-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    {isCancelling ? "Cancelling..." : "Cancel"}
                                  </button>
                                )}
                              <button
                                onClick={() => {
                                  const query = new URLSearchParams({
                                    movieId: String(tx.tmdb_movie_id),
                                    date: tx.show_date,
                                    time: tx.show_time,
                                    slotId: String(tx.timeslot_id),
                                    seats: tx.seats.join(","),
                                    amount: String(tx.totalAmount),
                                    bookingIds: tx.bookingIds.join(","),
                                    status: String(tx.status),
                                  });
                                  router.push(
                                    `/booking/summary?${query.toString()}`,
                                  );
                                }}
                                className="text-[10px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              >
                                View
                                <ChevronRight className="w-3 h-3 inline ml-1" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </MovieDataGate>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBookingsState
            onExplore={() => router.push("/movies")}
            message={emptyMessage}
          />
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
