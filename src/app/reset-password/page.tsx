/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Lock,
  Shield,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  YupPassword,
  YupStringNoLeadingTrailingSpaces,
} from "@/helpers/Schema";
import { FormikInput } from "@/components/FormikInput";
import { useResetPasswordMutation } from "@/store/authApi";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { clearOTPState } from "@/store/authSlice";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [resetPassword] = useResetPasswordMutation();
  const dispatch = useDispatch();
  const email =
    useSelector((state: RootState) => (state.auth as any).email) || "";
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validation schema with Yup
  const resetPasswordSchema = Yup.object().shape({
    newPassword: YupPassword,
    confirmPassword: YupStringNoLeadingTrailingSpaces.oneOf(
      [Yup.ref("newPassword")],
      "Passwords must match",
    ),
  });

  // Initial form values
  const initialValues = {
    newPassword: "",
    confirmPassword: "",
  };

  // Check if email is available
  useEffect(() => {
    if (!email) {
      showToast.error("Reset session expired. Please try again.");
      router.push("/forgot-password");
    }
  }, [email, router]);

  // Handle form submission
  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    try {
      // For now, we'll use a mock reset token since the backend doesn't return one
      // In a real implementation, this would come from the OTP verification response
      const resetToken = "mock_reset_token";

      const result = await resetPassword({
        reset_token: resetToken,
        new_password: values.newPassword,
      }).unwrap();

      showToast.auth.passwordResetSent();
      setIsSubmitted(true);

      // Clear OTP state
      dispatch(clearOTPState());

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: unknown) {
      console.error("Reset password error:", error);
      const errorMessage =
        (error as Error & { data?: { message?: string } })?.data?.message ||
        (error as Error)?.message ||
        "Failed to reset password";
      showToast.auth.passwordResetError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black overflow-hidden">
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
                Set New Password
              </h1>
              <p className="text-lg text-zinc-300 max-w-md">
                Create a strong password for your account. Make sure it&apos;s
                unique and secure.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center group hover:bg-primary/30 transition-colors">
                  <Shield className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="font-semibold">Secure Password</p>
                  <p className="text-sm text-zinc-400">Protect your account</p>
                </div>
              </div>

              <div className="flex items-center gap-8 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Strong Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                  <span>Instant Update</span>
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

      {/* Right Side - Reset Password Form */}
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
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Cinemate</span>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/50 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 lg:p-8">
            {/* Success state */}
            {isSubmitted ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">
                    Password Reset!
                  </h2>
                  <p className="text-zinc-400">
                    Your password has been successfully reset.
                  </p>
                  <p className="text-sm text-zinc-500">
                    Redirecting to login...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-3 mb-6 lg:mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">
                    Reset Password
                  </h2>
                  <p className="text-zinc-400 text-sm lg:text-base">
                    Enter your new password for {email}
                  </p>
                </div>

                <Formik
                  initialValues={initialValues}
                  validationSchema={resetPasswordSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form className="space-y-4 lg:space-y-5">
                      <FormikInput
                        name="newPassword"
                        type="password"
                        label="New Password"
                        placeholder="Enter your new password"
                        icon={<Lock className="h-4 w-4 text-zinc-500" />}
                        showPasswordToggle={true}
                        className={`${
                          errors.newPassword && touched.newPassword
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }`}
                      />

                      <FormikInput
                        name="confirmPassword"
                        type="password"
                        label="Confirm New Password"
                        placeholder="Confirm your new password"
                        icon={<Lock className="h-4 w-4 text-zinc-500" />}
                        showPasswordToggle={true}
                        className={`${
                          errors.confirmPassword && touched.confirmPassword
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }`}
                      />

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 transform hover:scale-[1.02] transition-all duration-300 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{
                          background:
                            "linear-gradient(to right, #E50914, #8b0000)",
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Resetting Password...
                          </>
                        ) : (
                          <>
                            Reset Password
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>

                      <div className="relative my-4">
                        <Separator className="bg-zinc-700/50" />
                      </div>

                      <div className="text-center space-y-4">
                        <p className="text-xs text-zinc-400">
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
                    </Form>
                  )}
                </Formik>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
