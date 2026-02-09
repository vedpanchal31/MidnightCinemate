import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  SignUpRequest,
  OTPType,
  OTPResponse,
  ErrorResponse
} from '@/lib/database/schema';
import { sendOTPEmail } from '@/lib/email/smtp';
import { generateOTP, validateEmail } from '@/lib/utils/auth';
import { findUserByEmail, createUser, createOTP } from '@/lib/database/db-service';

export async function POST(request: Request) {
  try {
    const body: SignUpRequest = await request.json();

    // Validate input
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Email, password, and name are required'
      }, { status: 400 });
    }

    if (!validateEmail(body.email)) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 });
    }

    if (body.password.length < 8) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(body.email);
    if (existingUser) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create user in database
    await createUser({
      email: body.email,
      password: hashedPassword,
      name: body.name
    });

    // Generate OTP for email verification
    const otpCode = generateOTP();
    await createOTP({
      email: body.email,
      code: otpCode,
      type: OTPType.EMAIL_VERIFICATION,
      expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP email
    await sendOTPEmail(body.email, otpCode, OTPType.EMAIL_VERIFICATION, body.name);

    const response: OTPResponse = {
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      data: {
        email: body.email,
        type: OTPType.EMAIL_VERIFICATION
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json<ErrorResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
