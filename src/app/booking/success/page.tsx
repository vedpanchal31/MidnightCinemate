"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  Clock,
  Ticket,
  ChevronRight,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shimmer } from "@/components/ui/shimmer";
import {
  useGetBookingBySessionIdQuery,
  useGetMovieByIdQuery,
} from "@/store/moviesApi";
import { formatDate } from "@/helpers/HelperFunction";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import toast from "react-hot-toast";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const router = useRouter();
  const ticketRef = useRef<HTMLDivElement | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  // Fetch booking details using the session ID
  const {
    data: bookingData,
    isLoading,
    error,
  } = useGetBookingBySessionIdQuery(sessionId || "", {
    skip: !sessionId,
  });

  const booking = bookingData?.data;
  const { data: movie } = useGetMovieByIdQuery(booking?.tmdb_movie_id || 0, {
    skip: !booking?.tmdb_movie_id,
  });

  const shareUrl = useMemo(() => {
    if (!sessionId || typeof window === "undefined") return "";
    return `${window.location.origin}/booking/success?session_id=${encodeURIComponent(
      sessionId,
    )}`;
  }, [sessionId]);

  useEffect(() => {
    let isMounted = true;
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, { margin: 2, width: 180 })
      .then((url) => {
        if (isMounted) setQrUrl(url);
      })
      .catch((err) => {
        console.error("QR generation failed:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [shareUrl]);

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

  // Format date and time from UTC to local
  const formattedDate = booking.show_date
    ? formatDate(booking.show_date, "ddd, MMM D, YYYY")
    : "Date not available";
  const formattedTime = booking.show_time
    ? formatDate(`2000-01-01T${booking.show_time}`, "hh:mm A")
    : "Time not available";
  const seats = Array.isArray(booking.seat_ids) ? booking.seat_ids : [];
  const ticketTitle = movie?.title || "Movie Ticket";

  return (
    <div className="max-w-5xl w-full animate-in fade-in zoom-in duration-500">
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

        <div className="p-8 space-y-8">
          <div className="grid md:grid-cols-[1.1fr_1fr] gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                    Show Date
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formattedDate}
                  </p>
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
                  <p className="text-sm font-bold text-white">
                    {formattedTime}
                  </p>
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

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                    Seats
                  </p>
                  <p className="text-sm font-bold text-white">
                    {seats.length > 0
                      ? seats.join(", ")
                      : "Seats not available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-black">
                    After-show Memory
                  </p>
                  <h2 className="text-xl font-black text-white">
                    {ticketTitle}
                  </h2>
                </div>
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Ticket QR"
                    className="w-20 h-20 rounded-xl border border-white/10 bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl border border-white/10 bg-zinc-800 animate-pulse" />
                )}
              </div>

              <div
                ref={ticketRef}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 space-y-4"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-32 rounded-2xl overflow-hidden border border-white/10 bg-zinc-800">
                    {movie?.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt={ticketTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                        Poster
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 font-black">
                      Ticket Poster
                    </p>
                    <h3 className="text-lg font-black text-white">
                      {ticketTitle}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                      <p>
                        Date:{" "}
                        <span className="text-zinc-200">{formattedDate}</span>
                      </p>
                      <p>
                        Time:{" "}
                        <span className="text-zinc-200">{formattedTime}</span>
                      </p>
                      <p>
                        Seats:{" "}
                        <span className="text-zinc-200">
                          {seats.length > 0 ? seats.join(", ") : "N/A"}
                        </span>
                      </p>
                      <p>
                        Amount:{" "}
                        <span className="text-zinc-200">₹{booking.amount}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">
                      Shareable Ticket
                    </p>
                    <p className="text-xs text-zinc-400 truncate max-w-[220px]">
                      {shareUrl || "Generating link..."}
                    </p>
                  </div>
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="Ticket QR"
                      className="w-16 h-16 rounded-xl border border-white/10 bg-white"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-white/10 bg-zinc-800 animate-pulse" />
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-black rounded-2xl"
                  onClick={async () => {
                    if (!ticketRef.current) return;
                    try {
                      const dataUrl = await toPng(ticketRef.current, {
                        cacheBust: true,
                        pixelRatio: 2,
                      });
                      const link = document.createElement("a");
                      link.href = dataUrl;
                      link.download = "movie-ticket-poster.png";
                      link.click();
                    } catch (err) {
                      console.error("Poster download failed:", err);
                      toast.error("Unable to download poster");
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Poster
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 border-white/20 text-white hover:bg-white/10 font-black rounded-2xl"
                  onClick={async () => {
                    if (!shareUrl) return;
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Ticket link copied");
                    } catch (err) {
                      console.error("Copy failed:", err);
                      toast.error("Unable to copy link");
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Share Link
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
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
