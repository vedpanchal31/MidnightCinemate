-- Role Enum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- User Table
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" DEFAULT 'USER',
    "is_email_verified" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "reset_token" TEXT,
    "reset_token_expires" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- OTP Table for email verification and password reset
CREATE TABLE "OTP" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" INTEGER NOT NULL, -- 1: EMAIL_VERIFICATION, 2: PASSWORD_RESET
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER DEFAULT 0,
    "is_used" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for OTP table
CREATE INDEX "idx_otp_email" ON "OTP"("email");
CREATE INDEX "idx_otp_email_type" ON "OTP"("email", "type");
