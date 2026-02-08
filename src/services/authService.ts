import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  SignUpRequest,
  LoginRequest,
  VerifyOTPRequest,
  ForgotPasswordRequest,
  ResendOTPRequest,
  ResetPasswordRequest,
  AuthResponse,
  LoginResponse,
  OTPResponse,
  ErrorResponse
} from '@/lib/database/schema';
import { baseQuery } from '@/lib/api/baseQuery';

export const authService = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQuery,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    // Sign Up
    signUp: builder.mutation<AuthResponse, SignUpRequest>({
      query: (credentials) => ({
        url: '/api/auth/signup',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Verify OTP
    verifyOTP: builder.mutation<OTPResponse, VerifyOTPRequest>({
      query: (data) => ({
        url: '/api/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Forgot Password
    forgotPassword: builder.mutation<OTPResponse, ForgotPasswordRequest>({
      query: (data) => ({
        url: '/api/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Resend OTP
    resendOTP: builder.mutation<OTPResponse, ResendOTPRequest>({
      query: (data) => ({
        url: '/api/auth/resend-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Reset Password
    resetPassword: builder.mutation<{ success: boolean; message: string }, ResetPasswordRequest>({
      query: (data) => ({
        url: '/api/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useSignUpMutation,
  useLoginMutation,
  useVerifyOTPMutation,
  useForgotPasswordMutation,
  useResendOTPMutation,
  useResetPasswordMutation,
} = authService;
