import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  LoginRequest,
  LoginResponse,
  OTPType,
  ErrorResponse
} from '@/lib/database/schema';
import { sendOTPEmail } from '@/lib/email/smtp';
import { generateOTP, validateEmail, generateJWTToken, generateRefreshToken } from '@/lib/utils/auth';
import { findUserByEmail, updateUser, createOTP } from '@/lib/database/db-service';

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
    const user = await findUserByEmail(body.email);
    if (!user) {
      console.log('Login failed: User not found for email:', body.email);
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
    console.log('Verifying password for user:', user.email);
    console.log('Stored hash:', user.password ? user.password.substring(0, 10) + '...' : 'null');
    console.log('Input password length:', body.password.length);
    
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    console.log('Password valid:', isPasswordValid);

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
      await createOTP({
        email: body.email,
        code: otpCode,
        type: OTPType.EMAIL_VERIFICATION,
        expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

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
            created_at: user.createdAt,
            updated_at: user.updatedAt,
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
    const token = generateJWTToken({
      userId: user.id,
      email: user.email,
      name: user.name
    }, '1h');
    
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await updateUser(body.email, { last_login: new Date() });

    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_email_verified: user.is_email_verified,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
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
