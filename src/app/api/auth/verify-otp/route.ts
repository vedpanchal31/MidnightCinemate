/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import {
  VerifyOTPRequest,
  OTPType,
  ErrorResponse
} from '@/lib/database/schema';
import { isOTPExpired } from '@/lib/utils/auth';

// Mock database - replace with actual database
const users: any[] = [];
const otps: any[] = [];

export async function POST(request: Request) {
  try {
    const body: VerifyOTPRequest = await request.json();

    // Validate input
    if (!body.email || !body.code || !body.type) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Email, code, and type are required'
      }, { status: 400 });
    }

    // Find valid OTP
    const validOTP = otps.find(otp =>
      otp.email === body.email &&
      otp.code === body.code &&
      otp.type === body.type &&
      !otp.is_used &&
      !isOTPExpired(otp.expires_at)
    );

    if (!validOTP) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Invalid or expired verification code'
      }, { status: 400 });
    }

    // Check attempts
    if (validOTP.attempts >= 3) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Too many attempts. Please request a new code.'
      }, { status: 400 });
    }

    // Mark OTP as used
    validOTP.is_used = true;
    validOTP.attempts += 1;

    // If email verification, update user's email verification status
    if (body.type === OTPType.EMAIL_VERIFICATION) {
      const user = users.find(u => u.email === body.email);
      if (user) {
        user.is_email_verified = true;
        user.updated_at = new Date();
      }

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully. You can now log in.',
        data: {
          email: body.email,
          is_verified: true
        }
      });
    }

    // If password reset, generate reset token
    if (body.type === OTPType.PASSWORD_RESET) {
      const resetToken = `reset_token_${Date.now()}_${Math.random().toString(36)}`;
      const user = users.find(u => u.email === body.email);
      if (user) {
        user.reset_token = resetToken;
        user.reset_token_expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        user.updated_at = new Date();
      }

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
        data: {
          email: body.email,
          reset_token: resetToken
        }
      });
    }

    return NextResponse.json<ErrorResponse>({
      success: false,
      message: 'Invalid OTP type'
    }, { status: 400 });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json<ErrorResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
