import { NextResponse } from "next/server";
import {
  ForgotPasswordRequest,
  OTPResponse,
  ErrorResponse,
} from "@/lib/database/schema";
import { sendOTPEmail } from "@/lib/email/smtp";
import { generateOTP } from "@/lib/utils/auth";
import { findUserByEmail, createOTP } from "@/lib/database/db-service";
import { OTPType } from "@/data/constants";

export async function POST(request: Request) {
  try {
    const body: ForgotPasswordRequest = await request.json();

    // Validate input
    if (!body.email) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 },
      );
    }

    // Find user
    const user = await findUserByEmail(body.email);
    if (!user) {
      // Don't reveal if email exists or not for security
      // Still return success to prevent email enumeration attacks
      return NextResponse.json<OTPResponse>(
        {
          success: true,
          message:
            "If an account with this email exists, you will receive a reset code.",
          data: {
            email: body.email,
            type: OTPType.PASSWORD_RESET,
          },
        },
        { status: 200 },
      );
    }

    // Generate OTP for password reset
    const otpCode = generateOTP();

    // Store OTP in database
    await createOTP({
      email: body.email,
      code: otpCode,
      type: OTPType.PASSWORD_RESET,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(
      body.email,
      otpCode,
      OTPType.PASSWORD_RESET,
      user.name,
    );

    if (!emailSent) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Failed to send reset email. Please try again.",
        },
        { status: 500 },
      );
    }

    const response: OTPResponse = {
      success: true,
      message: "Reset code sent successfully. Please check your email.",
      data: {
        email: body.email,
        type: OTPType.PASSWORD_RESET,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
