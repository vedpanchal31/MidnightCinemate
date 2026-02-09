/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Shield,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useVerifyOTPMutation, useResendOTPMutation } from "@/store/authApi";
import { useDispatch, useSelector } from "react-redux";
import {
  clearOTPState,
  setEmail,
  startResendCooldown,
  decrementResendCooldown
} from "@/store/authSlice";
import { RootState } from "@/store/store";
import { OTPType } from "@/lib/database/schema";
import { handleError } from "@/helpers/HelperFunction";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purpose = searchParams.get("purpose") || "signup";
  const [verifyOTP] = useVerifyOTPMutation();
  const [resendOTP] = useResendOTPMutation();
  const dispatch = useDispatch();

  const email = useSelector((state: RootState) => (state.auth as any).email);
  const resendOTPTimer = useSelector((state: RootState) => (state.auth as any).resendOTPTimer);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errors, setErrors] = useState({
    otp: "",
    general: "",
  });

  // Hydrate email from localStorage if missing in Redux
  useEffect(() => {
    if (!email) {
      const storedEmail = localStorage.getItem("signupEmail");
      if (storedEmail) {
        dispatch(setEmail(storedEmail));
      }
    }
  }, [email, dispatch]);

  // Check if email is available
  useEffect(() => {
    const timer = setTimeout(() => {
      // Small delay to allow hydration
      if (!email) {
        const storedEmail = localStorage.getItem("signupEmail");
        if (!storedEmail) {
          showToast.error("Email not found. Please start over.");
          router.push("/login");
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [email, router]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    // Clear errors when user starts typing
    if (errors.otp || errors.general) {
      setErrors({ otp: "", general: "" });
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(
        `otp-${index + 1}`,
      ) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(
        `otp-${index - 1}`,
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.split("");

    // Clear errors on paste
    if (errors.otp || errors.general) {
      setErrors({ otp: "", general: "" });
    }

    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6 && /^\d$/.test(digit)) {
        newOtp[index] = digit;
      }
    });
    setOtp(newOtp);
  };

  // Validate OTP
  const validateOtp = (otpArray: string[]) => {
    const otpValue = otpArray.join("");

    if (otpValue.length !== 6) {
      return "Please enter all 6 digits";
    }

    if (!/^\d{6}$/.test(otpValue)) {
      return "OTP must contain only numbers";
    }

    return "";
  };

  // Handle verification
  const handleVerify = async () => {
    const otpError = validateOtp(otp);

    if (otpError) {
      setErrors({ otp: otpError, general: "" });
      showToast.error(otpError);
      return;
    }

    setIsVerifying(true);
    setErrors({ otp: "", general: "" });

    try {
      const otpType =
        purpose === "reset-password"
          ? OTPType.PASSWORD_RESET
          : OTPType.EMAIL_VERIFICATION;
      await verifyOTP({
        email: email || "",
        code: otp.join(""),
        type: otpType,
      }).unwrap();

      setIsVerifying(false);
      showToast.auth.otpVerified();
      setIsVerified(true);

      // Clear OTP state only if not resetting password (we need email for the next step)
      if (purpose !== "reset-password") {
        dispatch(clearOTPState());
      }

      // Redirect based on purpose
      setTimeout(() => {
        if (purpose === "reset-password") {
          router.push("/reset-password");
        } else {
          router.push("/login");
        }
      }, 2000);
    } catch (error) {
      setIsVerifying(false);
      handleError(error as Error);
    }
  };

  // Handle resend
  const handleResend = async () => {
    setIsResending(true);
    setErrors({ otp: "", general: "" });

    try {
      const otpType =
        purpose === "reset-password"
          ? OTPType.PASSWORD_RESET
          : OTPType.EMAIL_VERIFICATION;
      await resendOTP({
        email: email || "",
        type: otpType,
      }).unwrap();

      setIsResending(false);
      showToast.auth.otpSent();
      dispatch(startResendCooldown());
      setOtp(["", "", "", "", "", ""]);
    } catch (error: unknown) {
      setIsResending(false);
      const errorMessage =
        (error as any)?.data?.message ||
        (error as Error)?.message ||
        "Failed to resend code";
      showToast.error(errorMessage);
      setErrors({
        otp: "",
        general: errorMessage,
      });
    }
  };

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendOTPTimer > 0) {
      timer = setTimeout(() => {
        dispatch(decrementResendCooldown());
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendOTPTimer, dispatch]);

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <div className="min-h-screen flex bg-black overflow-hidden">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-black to-black/60" />
          <Image
            src="https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1920&h=1080&fit=crop&q=80"
            alt="Security background"
            fill
            className="object-cover opacity-60"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center h-full p-12 text-white">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Cinemate</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold">
                Secure Your Account
              </h1>
              <p className="text-lg text-zinc-300 max-w-md">
                We&apos;ve sent a 6-digit verification code to your email
                address. Enter the code below to verify your identity and
                continue.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center group hover:bg-primary/30 transition-colors">
                  <Mail className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="font-semibold">Check Your Email</p>
                  <p className="text-sm text-zinc-400">Code sent to {email}</p>
                </div>
              </div>

              <div className="flex items-center gap-8 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Secure Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                  <span>Auto-Redirect</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-200" />
                  <span>Instant Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - OTP Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl animate-pulse delay-500" />

          {/* Floating particles */}
          <div className="absolute top-20 right-20 w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-100" />
          <div className="absolute top-40 left-32 w-3 h-3 bg-primary/30 rounded-full animate-bounce delay-300" />
          <div className="absolute bottom-32 right-40 w-2 h-2 bg-primary/35 rounded-full animate-bounce delay-700" />
          <div className="absolute bottom-20 left-20 w-4 h-4 bg-primary/25 rounded-full animate-bounce delay-1000" />
        </div>

        <div className="w-full max-w-sm lg:max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Cinemate</span>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/50 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 lg:p-8">
            {/* Success state */}
            {isVerified ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">
                    Verification Successful!
                  </h2>
                  <p className="text-zinc-400">
                    Your account has been verified. Redirecting...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-3 mb-6 lg:mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">
                    Enter Verification Code
                  </h2>
                  <p className="text-zinc-400 text-sm lg:text-base">
                    We sent a 6-digit code to {email}
                  </p>
                </div>

                <div className="space-y-6 lg:space-y-8">
                  {/* General Error */}
                  {errors.general && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.general}
                      </p>
                    </div>
                  )}

                  {/* OTP Input */}
                  <div className="space-y-4">
                    <Label className="text-zinc-300 font-medium text-sm text-center">
                      Verification Code
                    </Label>
                    <div className="flex justify-center gap-2 lg:gap-3">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          className={`w-10 h-12 lg:w-12 lg:h-14 text-center text-lg lg:text-xl font-bold bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.otp
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                            }`}
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="text-xs text-red-400 text-center flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.otp}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleVerify}
                    disabled={!isOtpComplete || isVerifying}
                    className="w-full text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 transform hover:scale-[1.02] transition-all duration-300 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: "linear-gradient(to right, #E50914, #8b0000)",
                    }}
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="relative my-4">
                    <Separator className="bg-zinc-700/50" />
                  </div>

                  <div className="text-center space-y-4">
                    <p className="text-xs text-zinc-400">
                      Didn&apos;t receive the code?
                    </p>
                    <Button
                      onClick={handleResend}
                      disabled={resendOTPTimer > 0 || isResending}
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl py-2 text-sm font-medium transform hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isResending ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : resendOTPTimer > 0 ? (
                        `Resend in ${formatTime(resendOTPTimer)}`
                      ) : (
                        "Resend Code"
                      )}
                    </Button>
                  </div>

                  <div className="text-center text-xs text-zinc-400 pt-2">
                    <Link
                      href="/login"
                      className="text-primary hover:text-primary/80 underline font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to Login
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
