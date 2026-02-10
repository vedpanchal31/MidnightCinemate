// Database Schema for Authentication System

import { OTPType } from "@/data/constants";

export interface User {
  id: string;
  email: string;
  password: string; // Hashed password
  name: string;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  reset_token?: string;
  reset_token_expires?: Date;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  reset_token?: string;
  reset_token_expires?: Date;
}

export interface OTP {
  id: string;
  email: string;
  code: string;
  type: OTPType;
  expires_at: Date;
  attempts: number;
  is_used: boolean;
  created_at: Date;
}

// API Response Types
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Omit<User, "password">;
    token: string;
    refresh_token: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: Omit<User, "password">;
    token: string;
    refresh_token: string;
    is_email_verified: boolean;
  };
}

export interface OTPResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    type: OTPType;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

// Request Types
export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOTPRequest {
  email: string;
  code: string;
  type: OTPType;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResendOTPRequest {
  email: string;
  type: OTPType;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
}
