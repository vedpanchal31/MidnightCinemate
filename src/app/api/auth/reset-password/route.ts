/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { 
  ResetPasswordRequest, 
  ErrorResponse 
} from '@/lib/database/schema';

// Mock database - replace with actual database
const users: any[] = [];

export async function POST(request: Request) {
  try {
    const body: ResetPasswordRequest = await request.json();
    
    // Validate input
    if (!body.reset_token || !body.new_password) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Reset token and new password are required'
      }, { status: 400 });
    }

    if (body.new_password.length < 8) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Find user with valid reset token
    const user = users.find(u => 
      u.reset_token === body.reset_token &&
      u.reset_token_expires &&
      new Date() < u.reset_token_expires
    );

    if (!user) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        message: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(body.new_password, 12);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.reset_token = undefined;
    user.reset_token_expires = undefined;
    user.updated_at = new Date();

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json<ErrorResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
