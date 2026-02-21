"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Lock,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useForgotPasswordMutation } from "@/store/authApi";
import { useDispatch } from "react-redux";
import { setEmail as setEmailInRedux } from "@/store/authSlice";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    general: "",
  });

  const validateEmail = (email: string) => {
    if (!email) {
      return "Email address is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({ email: "", general: "" });

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError, general: "" });
      showToast.error(emailError);
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();

      showToast.auth.passwordResetSent();
      setIsSubmitted(true);

      // Store email in Redux state for OTP page
      dispatch(setEmailInRedux(email));

      // Redirect to OTP verification after 2 seconds
      setTimeout(() => {
        router.push("/verify-otp?purpose=reset-password");
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        (error as Error & { data?: { message?: string } })?.data?.message ||
        (error as Error)?.message ||
        "Failed to send reset code. Please try again.";
      showToast.auth.passwordResetError(errorMessage);
      setErrors({
        email: "",
        general: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-black to-black/60" />
          <Image
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop&q=80"
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
                <Lock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Cinemate</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold">
                Reset Your Password
              </h1>
              <p className="text-lg text-zinc-300 max-w-md">
                Don&apos;t worry! We&apos;ll help you reset your password. Enter
                your email address and we&apos;ll send you a verification code.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center group hover:bg-primary/30 transition-colors">
                  <Shield className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="font-semibold">Secure Process</p>
                  <p className="text-sm text-zinc-400">
                    Safe & password recovery
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Email Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                  <span>Quick Reset</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-200" />
                  <span>Secure Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
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
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Cinemate</span>
          </div>

          <div className="bg-card/80 border border-border/70 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 lg:p-8">
            {/* Success state */}
            {isSubmitted ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    Email Sent!
                  </h2>
                  <p className="text-muted-foreground">
                    We&apos;ve sent a verification code to {email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Redirecting to verification...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-3 mb-6 lg:mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                    Forgot Password?
                  </h2>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Enter your email address and we&apos;ll send you a code to
                    reset your password
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 lg:space-y-5"
                >
                  {/* General Error */}
                  {errors.general && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.general}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-muted-foreground font-medium text-sm"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-zinc-500" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-10 h-10 bg-background/70 border-border/70 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                          errors.email
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }`}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={!email || isLoading}
                    className="w-full text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 transform hover:scale-[1.02] transition-all duration-300 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: "linear-gradient(to right, #E50914, #8b0000)",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        Send Reset Code
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="relative my-4">
                    <Separator className="bg-border/80" />
                  </div>

                  <div className="text-center space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Remember your password?
                    </p>
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-1 text-primary hover:text-primary/80 underline font-semibold transition-colors text-sm"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to Login
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
