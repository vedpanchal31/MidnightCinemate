-- Add missing columns to User table for authentication
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "is_email_verified" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS "reset_token" TEXT,
ADD COLUMN IF NOT EXISTS "reset_token_expires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "last_login" TIMESTAMP(3);

-- Create OTP table for email verification and password reset
CREATE TABLE IF NOT EXISTS "OTP" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" INTEGER NOT NULL, -- 1: EMAIL_VERIFICATION, 2: PASSWORD_RESET
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER DEFAULT 0,
    "is_used" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS "idx_otp_email" ON "OTP"("email");
CREATE INDEX IF NOT EXISTS "idx_otp_email_type" ON "OTP"("email", "type");
