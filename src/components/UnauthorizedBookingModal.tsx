import React from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clapperboard, Lock } from "lucide-react";

interface UnauthorizedBookingModalProps {
  show: boolean;
  close: () => void;
}

const UnauthorizedBookingModal: React.FC<UnauthorizedBookingModalProps> = ({
  show,
  close,
}) => {
  const router = useRouter();

  const handleLogin = () => {
    close();
    router.push("/login");
  };

  return (
    <Modal
      show={show}
      close={close}
      outsideClose={true}
      escapeClose={true}
      size="md"
      className="bg-zinc-900/95 border border-zinc-800 backdrop-blur-xl overflow-hidden"
    >
      {/* Background gradient accent */}
      <div
        className="absolute top-0 right-0 w-96 h-96 -z-10 blur-3xl opacity-20"
        style={{ background: "linear-gradient(to right, #E50914, #8b0000)" }}
      />

      <div className="px-6 md:px-10 py-10 flex flex-col items-center text-center relative">
        {/* Icon with cinematic styling */}
        <div className="mb-8">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-2 relative overflow-hidden"
            style={{
              borderColor: "rgba(229, 9, 20, 0.5)",
              background: "rgba(229, 9, 20, 0.1)",
            }}
          >
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background:
                  "linear-gradient(to right, rgba(229, 9, 20, 0.2), transparent)",
              }}
            />
            <Lock
              className="w-10 h-10 text-primary relative z-10"
              style={{ color: "#E50914" }}
            />
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text"
          style={{
            backgroundImage: "linear-gradient(to right, #E50914, #ff6b6b)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Login Required
        </h2>

        {/* Description */}
        <p className="text-zinc-400 text-base md:text-lg mb-8 max-w-sm leading-relaxed">
          To reserve your seats and complete your ticket booking, please log in
          to your MidnightCinemate account.
        </p>

        {/* Benefits with cinematic icons */}
        <div className="mb-10 w-full max-w-sm space-y-3 bg-zinc-800/50 backdrop-blur rounded-xl p-5 border border-zinc-700/50">
          <div className="flex items-center gap-3 text-zinc-300">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(229, 9, 20, 0.2)", color: "#E50914" }}
            >
              <Clapperboard className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium">
              Access exclusive movie premiere bookings
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-300">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(229, 9, 20, 0.2)", color: "#E50914" }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">
              Secure your favorite seats instantly
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-300">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(229, 9, 20, 0.2)", color: "#E50914" }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <span className="text-sm font-medium">
              Track bookings and manage reservations
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-6">
          <Button
            onClick={close}
            className={cn(
              "flex-1 py-3 text-base font-bold rounded-lg transition-all duration-300",
              "bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 hover:border-zinc-600",
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogin}
            className={cn(
              "flex-1 py-3 text-base font-bold rounded-lg transition-all duration-300 text-white",
              "shadow-lg",
            )}
            style={{
              background: "linear-gradient(to right, #E50914, #8b0000)",
              boxShadow: "0 10px 30px -10px rgba(229, 9, 20, 0.5)",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.boxShadow =
                "0 15px 40px -10px rgba(229, 9, 20, 0.7)";
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.boxShadow =
                "0 10px 30px -10px rgba(229, 9, 20, 0.5)";
              (e.target as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Login to Your Account
          </Button>
        </div>

        {/* Divider */}
        <div className="w-full max-w-sm h-px bg-linear-to-r from-transparent via-zinc-700 to-transparent my-5" />

        {/* Sign Up Link */}
        <p className="text-zinc-500 text-sm">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => {
              close();
              router.push("/signup");
            }}
            className="font-bold transition-colors hover:opacity-80 cursor-pointer"
            style={{ color: "#E50914" }}
          >
            Create One Now
          </button>
        </p>
      </div>
    </Modal>
  );
};

export default UnauthorizedBookingModal;
