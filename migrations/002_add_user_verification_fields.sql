-- Add email verification and active status fields to User table
ALTER TABLE "User" 
ADD COLUMN "is_email_verified" BOOLEAN DEFAULT false,
ADD COLUMN "is_active" BOOLEAN DEFAULT true;
