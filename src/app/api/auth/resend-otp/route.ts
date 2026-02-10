import { NextResponse } from 'next/server';
import {
  ResendOTPRequest,
  OTPResponse,
  ErrorResponse
} from '@/lib/database/schema';
import { sendOTPEmail } from '@/lib/email/smtp';
import { generateOTP } from '@/lib/utils/auth';
import { findUserByEmail, createOTP, findRecentOTP } from '@/lib/database/db-service';

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
    const user = await findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check for existing OTP within cooldown period (2 minutes)
    const recentOTP = await findRecentOTP(body.email, body.type, 2);

    if (recentOTP) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Please wait 2 minutes before requesting a new code'
      }, { status: 429 });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    await createOTP({
      email: body.email,
      code: otpCode,
      type: body.type,
      expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

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
