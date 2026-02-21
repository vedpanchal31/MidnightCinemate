// Database Schema for Authentication System

import { OTPType } from "@/data/constants";

export enum BookingStatus {
  PENDING_PAYMENT = 1, // payment intent created, seats locked
  CONFIRMED = 2, // payment success → ticket generated
  FAILED = 3, // payment failed
  EXPIRED = 4, // timeout → seats released
  CANCELLED = 5, // user/admin cancelled
  REFUNDED = 6, // refund completed
}

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

// Time Slot Management Types
export interface TimeSlot {
  id: string;
  tmdb_movie_id: number;
  show_date: string; // YYYY-MM-DD format
  show_time: string; // HH:MM format
  total_seats: number;
  available_seats: number;
  booked_seats?: number;
  price: number;
  screen_type: "2D" | "3D" | "IMAX" | "4DX";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTimeSlotRequest {
  tmdb_movie_id: number;
  show_date: string;
  show_time: string;
  total_seats: number;
  price: number;
  screen_type: "2D" | "3D" | "IMAX" | "4DX";
}

export interface UpdateTimeSlotRequest {
  total_seats?: number;
  available_seats?: number;
  price?: number;
  screen_type?: "2D" | "3D" | "IMAX" | "4DX";
  is_active?: boolean;
}

export interface TimeSlotResponse {
  success: boolean;
  message: string;
  data?: TimeSlot[];
}

export interface TimeSlotQuery {
  tmdb_movie_id?: number;
  date_from?: string;
  date_to?: string;
  screen_type?: "2D" | "3D" | "IMAX" | "4DX";
}

export interface Booking {
  id: number;
  user_id: string;
  tmdb_movie_id: number;
  show_date: string;
  show_time: string;
  seat_id?: string;
  seat_ids?: string[];
  price: number;
  status: BookingStatus;
  timeslot_id: string;
  stripe_payment_id?: string;
  stripe_session_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: number;
  stripe_session_id: string;
  stripe_payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: Date;
}

export interface CreateBookingRequest {
  user_id?: string;
  tmdb_movie_id: number;
  show_date: string;
  show_time: string;
  timeslot_id: string;
  seat_ids: string[];
  amount: number;
}
