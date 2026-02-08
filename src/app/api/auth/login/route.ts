import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  LoginRequest,
  LoginResponse,
  OTPType,
  ErrorResponse
} from '@/lib/database/schema';
import { sendOTPEmail } from '@/lib/email/smtp';
import { generateOTP, validateEmail } from '@/lib/utils/auth';
import { findUserByEmail, updateUser, mockOTPs } from '@/lib/database/mock-db';

export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    if (!validateEmail(body.email)) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 });
    }

    // Find user
    const user = findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Account has been deactivated'
      }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check email verification status
    if (!user.is_email_verified) {
      // Generate new OTP for email verification
      const otpCode = generateOTP();
      const otp = {
        id: 'mock_otp_id',
        email: body.email,
        code: otpCode,
        type: OTPType.EMAIL_VERIFICATION,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        is_used: false,
        created_at: new Date()
      };

      mockOTPs.push(otp);

      // Send OTP email
      await sendOTPEmail(body.email, otpCode, OTPType.EMAIL_VERIFICATION, user.name);

      const response: LoginResponse = {
        success: true,
        message: 'Please verify your email before logging in',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            is_email_verified: user.is_email_verified,
            created_at: user.created_at,
            updated_at: user.updated_at,
            is_active: user.is_active,
            last_login: user.last_login
          },
          token: '',
          refresh_token: '',
          is_email_verified: false
        }
      };

      return NextResponse.json(response, { status: 200 });
    }

    // User is verified, generate tokens and login
    const token = `mock_access_token_${Date.now()}`;
    const refreshToken = `mock_refresh_token_${Date.now()}`;

    // Update last login
    updateUser(body.email, { last_login: new Date() });

    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_email_verified: user.is_email_verified,
          created_at: user.created_at,
          updated_at: user.updated_at,
          is_active: user.is_active,
          last_login: user.last_login
        },
        token,
        refresh_token: refreshToken,
        is_email_verified: true
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ErrorResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
