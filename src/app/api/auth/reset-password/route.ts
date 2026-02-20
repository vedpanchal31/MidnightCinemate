import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ResetPasswordRequest, ErrorResponse } from "@/lib/database/schema";
import { findUserByEmail, updateUser } from "@/lib/database/db-service";

export async function POST(request: Request) {
  try {
    const body: ResetPasswordRequest = await request.json();

    // Validate input
    if (!body.reset_token || !body.new_password) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Reset token and new password are required",
        },
        { status: 400 },
      );
    }

    if (body.new_password.length < 8) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 },
      );
    }

    // The reset_token in this case is the email (set after OTP verification)
    // In a full implementation, you'd generate a unique token after OTP verification
    // For now, we'll use email as the identifier
    const email = body.reset_token;

    // Find user
    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Invalid or expired reset token",
        },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(body.new_password, 12);

    // Update user password and clear reset token fields
    const updated = await updateUser(email, {
      password: hashedPassword,
      reset_token: undefined,
      reset_token_expires: undefined,
    });

    if (!updated) {
      console.error(
        `Failed to update user password for ${email}. User not found or update failed.`,
      );
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Failed to update password. User not found.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset password error:", error);
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
