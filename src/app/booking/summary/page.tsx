/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Ticket,
  Film,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  useCreateCheckoutSessionMutation,
  useGetMovieByIdQuery,
} from "@/store/moviesApi";
import { convertDateTimeToUTC, formatDate } from "@/helpers/HelperFunction";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";
import { cn } from "@/lib/utils";

export default function BookingSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth as AuthState);

  const movieId = Number(searchParams.get("movieId") || 0);
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const slotId = searchParams.get("slotId") || "";
  const seats = (searchParams.get("seats") || "")
    .split(",")
    .map((seat) => seat.trim())
    .filter(Boolean);
  const amount = Number(searchParams.get("amount") || 0);
  const bookingIds = (searchParams.get("bookingIds") || "")
    .split(",")
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

  const { data: movie } = useGetMovieByIdQuery(movieId, { skip: !movieId });
  const [createCheckoutSession, { isLoading }] =
    useCreateCheckoutSessionMutation();

  const payDeadline = useMemo(() => {
    if (!date || !time) return null;
    const showStart = new Date(`${date}T${time}`);
    return new Date(showStart.getTime() - 60 * 60 * 1000);
  }, [date, time]);

  const isExpiredForPayment = useMemo(() => {
    if (!payDeadline) return true;
    return new Date() >= payDeadline;
  }, [payDeadline]);

  const formattedDate = date ? formatDate(date, "ddd, MMM D, YYYY") : "-";
  const formattedTime = time
    ? formatDate(`2000-01-01T${time}`, "hh:mm A")
    : "-";
  const seatCount = seats.length;
  const perSeatAmount = seatCount > 0 ? amount / seatCount : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(229,9,20,0.2),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="relative max-w-5xl mx-auto p-4 md:p-8 space-y-5">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Booking Summary
          </h1>
          <p className="text-zinc-400">
            Review details and complete payment to confirm your seats.
          </p>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 md:p-5">
            <div className="flex gap-4 items-start">
              <div className="w-24 md:w-28 shrink-0">
                <div className="aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-zinc-800/70">
                  {movie?.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <Film className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="inline-flex rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                  Payment Pending
                </div>
                <h2 className="text-lg md:text-2xl font-bold leading-tight line-clamp-2">
                  {movie?.title || "Movie"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                  <p>
                    Movie ID:{" "}
                    <span className="text-zinc-300 font-medium">
                      {movieId || "-"}
                    </span>
                  </p>
                  <p>
                    Slot ID:{" "}
                    <span className="text-zinc-300 font-medium">
                      {slotId || "-"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-5 md:p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-black/30 border border-white/5 p-4">
                <p className="text-xs text-zinc-500 flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" /> Show Date
                </p>
                <p className="font-bold text-lg">{formattedDate}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/5 p-4">
                <p className="text-xs text-zinc-500 flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" /> Show Time
                </p>
                <p className="font-bold text-lg">{formattedTime}</p>
              </div>
            </div>

            <div className="rounded-xl bg-black/30 border border-white/5 p-4 space-y-3">
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <Ticket className="w-4 h-4" /> Selected Seats
              </p>
              <div className="flex flex-wrap gap-2">
                {seats.map((seat) => (
                  <span
                    key={seat}
                    className="px-2.5 py-1 rounded-md text-xs font-bold border border-primary/40 bg-primary/20 text-primary"
                  >
                    {seat}
                  </span>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                <p>
                  Slot ID:{" "}
                  <span className="text-zinc-300 font-medium">
                    {slotId || "-"}
                  </span>
                </p>
                <p>
                  Booking Rows:{" "}
                  <span className="text-zinc-300 font-medium">
                    {bookingIds.length}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-zinc-950/70 p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-200 flex items-center gap-2 uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Details
                </p>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                    isExpiredForPayment
                      ? "bg-red-500/15 border-red-500/35 text-red-300"
                      : "bg-amber-500/15 border-amber-500/35 text-amber-300",
                  )}
                >
                  {isExpiredForPayment ? "Expired" : "Payment Pending"}
                </span>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                <p className="text-[11px] text-zinc-300 uppercase tracking-wider">
                  Total Payable
                </p>
                <p className="text-3xl md:text-4xl font-black leading-none mt-1">
                  Rs {amount}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-zinc-900 border border-white/10 px-3 py-2">
                  <p className="text-zinc-400 text-xs">Seats Selected</p>
                  <p className="text-zinc-100 font-semibold">{seatCount}</p>
                </div>
                <div className="rounded-lg bg-zinc-900 border border-white/10 px-3 py-2">
                  <p className="text-zinc-400 text-xs">Per Seat</p>
                  <p className="text-zinc-100 font-semibold">
                    Rs {perSeatAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-900 border border-white/10 px-3 py-3 text-sm">
                <p className="text-zinc-400 text-xs">Payment Deadline</p>
                <p className="text-zinc-100 font-semibold">
                  {payDeadline ? payDeadline.toLocaleString() : "-"}
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  Booking expires automatically 1 hour before show time.
                </p>
              </div>
            </div>

            {isExpiredForPayment && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Payment window expired. Please book seats again.
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-44"
                onClick={() => router.push("/transactions")}
              >
                Go to Bookings
              </Button>
              <Button
                size="lg"
                className={cn(
                  "w-full sm:w-44",
                  isExpiredForPayment && "opacity-60",
                )}
                disabled={
                  isLoading ||
                  isExpiredForPayment ||
                  !movieId ||
                  !slotId ||
                  !date ||
                  !time ||
                  seats.length === 0 ||
                  bookingIds.length === 0
                }
                onClick={async () => {
                  try {
                    const utc = convertDateTimeToUTC(date, time);
                    const utcDate = utc.split("T")[0];
                    const utcTime = utc.split("T")[1].replace("Z", "");

                    const response = await createCheckoutSession({
                      user_id: user?.id,
                      user_email: user?.email,
                      tmdb_movie_id: movieId,
                      movie_title: movie?.title,
                      show_date: utcDate,
                      show_time: utcTime,
                      timeslot_id: slotId,
                      seat_ids: seats,
                      amount,
                      booking_ids: bookingIds,
                    }).unwrap();

                    if (response.url) {
                      router.push(response.url);
                      return;
                    }
                    toast.error("Failed to start payment");
                  } catch (error) {
                    console.error("Checkout error", error);
                    toast.error("Unable to start payment");
                  }
                }}
              >
                {isLoading ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
