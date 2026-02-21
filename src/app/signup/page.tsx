"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Film,
  Play,
  Sparkles,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  YupEmail,
  YupPassword,
  YupStringMaxLength,
  YupStringNoLeadingTrailingSpaces,
} from "@/helpers/Schema";
import { useTranslation } from "react-i18next";
import { FormikInput } from "@/components/FormikInput";

import { useSignUpMutation } from "@/store/authApi";
import { handleError } from "@/helpers/HelperFunction";

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [signUp] = useSignUpMutation();

  // Validation schema with Yup
  const signupSchema = Yup.object().shape({
    name: YupStringMaxLength(100),
    email: YupEmail,
    password: YupPassword,
    confirmPassword: YupStringNoLeadingTrailingSpaces.oneOf(
      [Yup.ref("password")],
      t("COMMON.PASSWORD.MUST.MATCH"),
    ),
  });

  // Initial form values
  const initialValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  };

  // Handle form submission
  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    try {
      if (!values.terms) {
        showToast.error("Please accept the terms and conditions");
        setSubmitting(false);
        return;
      }

      const result = await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
      }).unwrap();

      if (result.success) {
        showToast.auth.signupSuccess();

        // Redirect to OTP verification with email parameter
        setTimeout(() => {
          router.push(
            `/verify-otp?purpose=signup&email=${encodeURIComponent(values.email)}`,
          );
        }, 1500);
      }
    } catch (error) {
      handleError(error as Error);
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
            src="https://images.unsplash.com/photo-1763748998933-7e09e6504529?auto=format&fit=crop&q=80&w=2000"
            alt="Cinema background"
            fill
            className="object-cover opacity-60"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center h-full p-12 text-white">
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:scale-105 transition-transform">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Cinemate</span>
            </Link>

            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight">
                Join the Ultimate
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #E50914, #ff4d4d, #8b0000)",
                    WebkitBackgroundClip: "text",
                  }}
                >
                  {" "}
                  Cinema Experience
                </span>
              </h1>
              <p className="text-xl text-zinc-300 max-w-md">
                Create your account and unlock exclusive movie premieres,
                premium seating, and personalized recommendations.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Premium Features</p>
                    <p className="text-sm text-zinc-400">
                      Early access to tickets & exclusive content
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Watch Trailers</p>
                    <p className="text-sm text-zinc-400">
                      Get sneak peeks before anyone else
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>50K+ Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                  <span>1000+ Movies</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-200" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
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
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-primary/30 rounded-full animate-bounce delay-500" />
          <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-primary/25 rounded-full animate-bounce delay-800" />
        </div>

        <div className="w-full max-w-sm lg:max-w-md relative z-10">
          {/* Mobile logo */}
          <Link
            href="/"
            className="lg:hidden flex items-center justify-center gap-3 mb-6 group"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Cinemate</span>
          </Link>

          <div className="bg-zinc-900/60 border border-zinc-800/50 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 lg:p-8">
            <div className="text-center space-y-3 mb-6 lg:mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-white">
                Create Account
              </h2>
              <p className="text-zinc-400 text-sm lg:text-base">
                Join us and start your cinema journey
              </p>
            </div>

            <Formik
              initialValues={initialValues}
              validationSchema={signupSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4 lg:space-y-5">
                  <FormikInput
                    name="name"
                    type="text"
                    label="Full Name"
                    placeholder="Enter your full name"
                    icon={<User className="h-4 w-4 text-zinc-500" />}
                    className={`${
                      errors.name && touched.name
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : ""
                    }`}
                  />

                  <FormikInput
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    icon={<Mail className="h-4 w-4 text-zinc-500" />}
                    className={`${
                      errors.email && touched.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : ""
                    }`}
                  />

                  <FormikInput
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="Create a strong password"
                    icon={<Lock className="h-4 w-4 text-zinc-500" />}
                    showPasswordToggle={true}
                    className={`${
                      errors.password && touched.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : ""
                    }`}
                  />

                  <FormikInput
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    icon={<Lock className="h-4 w-4 text-zinc-500" />}
                    showPasswordToggle={true}
                    className={`${
                      errors.confirmPassword && touched.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : ""
                    }`}
                  />

                  <div className="flex items-start space-x-2">
                    <Field name="terms">
                      {({
                        field,
                        form,
                      }: {
                        field: { value: boolean };
                        form: {
                          setFieldValue: (
                            field: string,
                            value: boolean,
                          ) => void;
                        };
                      }) => (
                        <Checkbox
                          id="terms"
                          size="md"
                          checked={field.value}
                          className="mt-0.5 shrink-0 data-[state=checked]:shadow-red-500/45"
                          onCheckedChange={(checked) => {
                            form.setFieldValue("terms", checked === true);
                          }}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="terms">
                      {(msg) => <p className="text-xs text-red-400">{msg}</p>}
                    </ErrorMessage>
                    <Label
                      htmlFor="terms"
                      className="text-xs text-zinc-400 leading-relaxed"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:text-primary/80 underline font-medium transition-colors"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:text-primary/80 underline font-medium transition-colors"
                      >
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 transform hover:scale-[1.02] transition-all duration-300 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: "linear-gradient(to right, #E50914, #8b0000)",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="relative my-4">
                    <Separator className="bg-zinc-700/50" />
                    <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-900/60 px-3 text-xs text-zinc-500 font-medium">
                      OR SIGN UP WITH
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl py-2.5 text-sm font-medium transform hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm shadow-lg"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Google</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl py-2.5 text-sm font-medium transform hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm shadow-lg"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span>GitHub</span>
                      </span>
                    </Button>
                  </div>

                  <div className="text-center text-xs text-zinc-400 pt-2">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:text-primary/80 underline font-semibold transition-colors"
                    >
                      Sign in
                    </Link>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
