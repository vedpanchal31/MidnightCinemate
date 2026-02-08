/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import {
  ForgotPasswordRequest,
  OTPType,
  OTPResponse,
  ErrorResponse
} from '@/lib/database/schema';
import { sendOTPEmail } from '@/lib/email/smtp';
import { generateOTP } from '@/lib/utils/auth';

// Mock database - replace with actual database
const users: any[] = [];

export async function POST(request: Request) {
  try {
    const body: ForgotPasswordRequest = await request.json();

    // Validate input
    if (!body.email) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Email is required'
      }, { status: 400 });
    }

    // Find user
    const user = users.find(u => u.email === body.email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'If an account with this email exists, you will receive a reset code.'
      }, { status: 200 });
    }

    // Generate OTP for password reset
    const otpCode = generateOTP();

    // In a real implementation, store this in database
    // For now, just send the email with OTP

    // Send OTP email
    const emailSent = await sendOTPEmail(body.email, otpCode, OTPType.PASSWORD_RESET, user?.name || 'User');

    if (!emailSent) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Failed to send reset email. Please try again.'
      }, { status: 500 });
    }

    const response: OTPResponse = {
      success: true,
      message: 'If an account with this email exists, you will receive a reset code.',
      data: {
        email: body.email,
        type: OTPType.PASSWORD_RESET
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json<ErrorResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
