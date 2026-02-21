"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { XCircle, AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_50%)]" />

      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-8">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>

            <h1 className="text-3xl font-black text-white mb-4">
              Payment Cancelled
            </h1>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Your payment process was cancelled. No charges were made to your
              account. You can try booking your seats again.
            </p>

            <div className="flex flex-col gap-4 w-full">
              <Button
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-[0_10px_20px_-5px_rgba(229,9,20,0.3)]"
                onClick={() => router.back()}
              >
                Try Again
              </Button>

              <Button
                variant="ghost"
                className="w-full h-14 text-zinc-400 hover:text-white hover:bg-white/5 font-bold rounded-2xl"
                onClick={() => router.push("/")}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>

          <div className="bg-red-500/5 p-4 flex items-center justify-center gap-3 border-t border-white/5">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-[10px] uppercase font-bold text-red-500 tracking-widest">
              Seats are still available for booking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
