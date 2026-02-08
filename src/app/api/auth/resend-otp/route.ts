import { NextResponse } from 'next/server';
import {
  ResendOTPRequest,
  OTPResponse,
  ErrorResponse
} from '@/lib/database/schema';
import { sendOTPEmail } from '@/lib/email/smtp';
import { generateOTP } from '@/lib/utils/auth';
import { findUserByEmail, addOTP, mockOTPs } from '@/lib/database/mock-db';

export async function POST(request: Request) {
  try {
    const body: ResendOTPRequest = await request.json();

    // Validate input
    if (!body.email || !body.type) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Email and type are required'
      }, { status: 400 });
    }

    // Check if user exists
    const user = findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check for existing OTP within cooldown period (2 minutes)
    const recentOTP = mockOTPs.find(otp =>
      otp.email === body.email &&
      otp.type === body.type &&
      !otp.is_used &&
      (Date.now() - otp.created_at.getTime() < 2 * 60 * 1000) // 2 minutes
    );

    if (recentOTP) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Please wait 2 minutes before requesting a new code'
      }, { status: 429 });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otp = {
      id: 'mock_otp_id',
      email: body.email,
      code: otpCode,
      type: body.type,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      is_used: false,
      created_at: new Date()
    };

    addOTP(otp);

    // Send OTP email
    const emailSent = await sendOTPEmail(body.email, otpCode, body.type, user.name);

    if (!emailSent) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Failed to send email. Please try again.'
      }, { status: 500 });
    }

    const response: OTPResponse = {
      success: true,
      message: `Verification code sent to ${body.email}`,
      data: {
        email: body.email,
        type: body.type
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json<ErrorResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
