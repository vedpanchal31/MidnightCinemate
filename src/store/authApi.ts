import { createApi } from "@reduxjs/toolkit/query/react";
import {
  SignUpRequest,
  LoginRequest,
  LoginResponse,
  VerifyOTPRequest,
  ForgotPasswordRequest,
  ResendOTPRequest,
  ResetPasswordRequest,
  OTPResponse,
} from "@/lib/database/schema";
import { baseQuery } from "@/lib/api/baseQuery";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQuery,
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    // Sign Up
    signUp: builder.mutation<OTPResponse, SignUpRequest>({
      query: (credentials) => ({
        url: "/api/auth/signup",
        method: "POST",
        data: credentials,
      }),
    }),

    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        data: credentials,
      }),
    }),

    // Google Login
    googleLogin: builder.mutation<
      LoginResponse,
      { idToken?: string; accessToken?: string }
    >({
      query: (payload) => ({
        url: "/api/auth/google-login",
        method: "POST",
        data: payload,
      }),
    }),

    // Verify OTP
    verifyOTP: builder.mutation<OTPResponse, VerifyOTPRequest>({
      query: (data) => ({
        url: "/api/auth/verify-otp",
        method: "POST",
        data: data,
      }),
    }),

    // Forgot Password
    forgotPassword: builder.mutation<OTPResponse, ForgotPasswordRequest>({
      query: (data) => ({
        url: "/api/auth/forgot-password",
        method: "POST",
        data: data,
      }),
    }),

    // Resend OTP
    resendOTP: builder.mutation<OTPResponse, ResendOTPRequest>({
      query: (data) => ({
        url: "/api/auth/resend-otp",
        method: "POST",
        data: data,
      }),
    }),

    // Reset Password
    resetPassword: builder.mutation<
      { success: boolean; message: string },
      ResetPasswordRequest
    >({
      query: (data) => ({
        url: "/api/auth/reset-password",
        method: "POST",
        data: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useSignUpMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useVerifyOTPMutation,
  useForgotPasswordMutation,
  useResendOTPMutation,
  useResetPasswordMutation,
} = authApi;
