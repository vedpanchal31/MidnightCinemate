"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  Clock,
  Ticket,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shimmer } from "@/components/ui/shimmer";
import { useGetBookingBySessionIdQuery } from "@/store/moviesApi";
import { formatDate } from "@/helpers/HelperFunction";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const router = useRouter();

  // Fetch booking details using the session ID
  const {
    data: bookingData,
    isLoading,
    error,
  } = useGetBookingBySessionIdQuery(sessionId || "", {
    skip: !sessionId,
  });

  if (isLoading || !bookingData) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <Shimmer className="w-20 h-20 rounded-full" />
        <div className="space-y-3 flex flex-col items-center">
          <Shimmer className="h-8 w-64" />
          <Shimmer className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (error || !bookingData.success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-2">
            Error Loading Booking
          </h1>
          <p className="text-zinc-400">Unable to fetch booking details</p>
        </div>
      </div>
    );
  }

  const booking = bookingData.data;

  // Format date and time from UTC to local
  const formattedDate = booking.show_date
    ? formatDate(booking.show_date, "ddd, MMM D, YYYY")
    : "Date not available";
  const formattedTime = booking.show_time
    ? formatDate(`2000-01-01T${booking.show_time}`, "hh:mm A")
    : "Time not available";

  return (
    <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-8 flex flex-col items-center text-center border-b border-white/5">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-green-400 font-medium tracking-wide text-sm uppercase">
            Booking Confirmed
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                  Show Date
                </p>
                <p className="text-sm font-bold text-white">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                  Show Time
                </p>
                <p className="text-sm font-bold text-white">{formattedTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                  Session ID
                </p>
                <p className="text-xs font-mono text-zinc-400 truncate w-48">
                  {sessionId}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-black rounded-2xl group transition-all"
              onClick={() => router.push("/")}
            >
              Go to Home
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-center text-xs text-zinc-500">
              A confirmation email has been sent to your registered address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full" />

      <Suspense fallback={<div>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
