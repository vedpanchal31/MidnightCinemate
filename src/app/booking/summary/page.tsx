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
import moment from "moment";
import { Button } from "@/components/ui/button";
import {
  useCreateCheckoutSessionMutation,
  useGetMovieByIdQuery,
  useGetBookingSummaryQuery,
} from "@/store/moviesApi";
import { convertDateTimeToUTC, formatDate } from "@/helpers/HelperFunction";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AuthState } from "@/store/authSlice";
import { cn } from "@/lib/utils";
import { BookingStatus } from "@/lib/database/schema";

export default function BookingSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth as AuthState);

  const movieIdParam = Number(searchParams.get("movieId") || 0);
  const dateParam = searchParams.get("date") || "";
  const timeParam = searchParams.get("time") || "";
  const normalizedTimeParam = timeParam.includes("T")
    ? timeParam.split("T")[1]
    : timeParam;
  const dateMomentParam = dateParam ? moment(dateParam) : null;
  const slotIdParam = searchParams.get("slotId") || "";
  const seatsParam = (searchParams.get("seats") || "")
    .split(",")
    .map((seat) => seat.trim())
    .filter(Boolean);
  const amountParam = Number(searchParams.get("amount") || 0);
  const statusParam = searchParams.get("status");
  const parsedStatus = Number(statusParam);
  const bookingStatusParam = Number.isNaN(parsedStatus)
    ? BookingStatus.PENDING_PAYMENT
    : parsedStatus;
  const bookingIds = (searchParams.get("bookingIds") || "")
    .split(",")
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

  const summaryQuery = useGetBookingSummaryQuery(
    { user_id: user?.id || "", booking_ids: bookingIds },
    { skip: !user?.id || bookingIds.length === 0 },
  );
  const summary = summaryQuery.data?.data;

  const effectiveStatus =
    typeof summary?.status === "number" ? summary.status : bookingStatusParam;
  const movieId = summary?.tmdb_movie_id || movieIdParam;
  const slotId = summary?.timeslot_id || slotIdParam;
  const seats = summary?.seat_ids?.length ? summary.seat_ids : seatsParam;
  const amount = summary?.amount ? Number(summary.amount) : amountParam;
  const normalizedTime = summary?.show_time
    ? String(summary.show_time)
    : normalizedTimeParam;
  const dateMoment = summary?.show_date
    ? moment(summary.show_date)
    : dateMomentParam;

  const statusDetails = useMemo(() => {
    switch (effectiveStatus) {
      case BookingStatus.CONFIRMED:
        return {
          label: "Confirmed",
          helper: "Your booking is confirmed. Enjoy the show.",
          badge: "bg-emerald-500/15 border-emerald-500/35 text-emerald-300",
          paymentLabel: "Payment Successful",
          allowPayment: false,
        };
      case BookingStatus.FAILED:
        return {
          label: "Payment Failed",
          helper: "Payment failed. Please try booking again.",
          badge: "bg-red-500/15 border-red-500/35 text-red-300",
          paymentLabel: "Payment Failed",
          allowPayment: false,
        };
      case BookingStatus.EXPIRED:
        return {
          label: "Booking Expired",
          helper: "Payment window expired. Please book seats again.",
          badge: "bg-red-500/15 border-red-500/35 text-red-300",
          paymentLabel: "Expired",
          allowPayment: false,
        };
      case BookingStatus.CANCELLED:
        return {
          label: "Booking Cancelled",
          helper: "This booking was cancelled. You can book again anytime.",
          badge: "bg-orange-500/15 border-orange-500/35 text-orange-300",
          paymentLabel: "Cancelled",
          allowPayment: false,
        };
      case BookingStatus.REFUNDED:
        return {
          label: "Booking Refunded",
          helper: "Your refund has been processed.",
          badge: "bg-orange-500/15 border-orange-500/35 text-orange-300",
          paymentLabel: "Refunded",
          allowPayment: false,
        };
      case BookingStatus.PENDING_PAYMENT:
      default:
        return {
          label: "Payment Pending",
          helper: "Review details and complete payment to confirm your seats.",
          badge: "bg-amber-500/15 border-amber-500/35 text-amber-300",
          paymentLabel: "Payment Pending",
          allowPayment: true,
        };
    }
  }, [effectiveStatus]);

  const { data: movie } = useGetMovieByIdQuery(movieId, { skip: !movieId });
  const [createCheckoutSession, { isLoading }] =
    useCreateCheckoutSessionMutation();

  const payDeadline = useMemo(() => {
    if (!dateMoment || !normalizedTime) return null;
    const showStart = moment(
      `${dateMoment.format("YYYY-MM-DD")}T${normalizedTime}`,
      moment.ISO_8601,
      true,
    );
    if (!showStart.isValid()) return null;
    return showStart.clone().subtract(1, "hour");
  }, [dateMoment, normalizedTime]);

  const isExpiredForPayment = useMemo(() => {
    if (!payDeadline) return true;
    return moment().isSameOrAfter(payDeadline);
  }, [payDeadline]);
  const isPendingPayment = effectiveStatus === BookingStatus.PENDING_PAYMENT;
  const showExpiredWarning = isPendingPayment && isExpiredForPayment;

  const formattedDate = dateMoment
    ? dateMoment.format("ddd, MMM D, YYYY")
    : "-";
  const formattedTime = normalizedTime
    ? moment(`2000-01-01T${normalizedTime}`).format("hh:mm A")
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
          <p className="text-zinc-400">{statusDetails.helper}</p>
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
                <div
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border",
                    statusDetails.badge,
                  )}
                >
                  {statusDetails.label}
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
                    statusDetails.badge,
                  )}
                >
                  {isPendingPayment && isExpiredForPayment
                    ? "Expired"
                    : statusDetails.paymentLabel}
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
                  {payDeadline
                    ? payDeadline.local().format("MMM D, YYYY, h:mm A")
                    : "-"}
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  Booking expires automatically 1 hour before show time.
                </p>
              </div>
            </div>

            {showExpiredWarning && (
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
                onClick={() => router.push("/bookings")}
              >
                Go to Bookings
              </Button>
              {statusDetails.allowPayment && (
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
                    !dateMoment ||
                    !normalizedTime ||
                    seats.length === 0 ||
                    bookingIds.length === 0
                  }
                  onClick={async () => {
                    try {
                      const effectiveDate = dateMoment
                        ? dateMoment.format("YYYY-MM-DD")
                        : "";
                      const utc = convertDateTimeToUTC(
                        effectiveDate,
                        normalizedTime || "00:00:00",
                      );
                      const utcMoment = moment.utc(utc);
                      if (!utcMoment.isValid()) {
                        toast.error("Invalid show time. Please rebook seats.");
                        return;
                      }
                      const utcDate = utcMoment.format("YYYY-MM-DD");
                      const utcTime = utcMoment.format("HH:mm:ss");

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
                      const anyErr = error as {
                        data?: { message?: string };
                        message?: string;
                      };
                      toast.error(
                        anyErr?.data?.message ||
                          anyErr?.message ||
                          "Unable to start payment",
                      );
                    }
                  }}
                >
                  {isLoading ? "Processing..." : "Pay Now"}
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
