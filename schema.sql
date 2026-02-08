-- Role Enum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- BookingStatus Enum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED');

-- SeatType Enum
CREATE TYPE "SeatType" AS ENUM ('STANDARD', 'PREMIUM', 'VIP');

-- User Table
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- City Table
CREATE TABLE "City" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL,
    "slug" TEXT UNIQUE NOT NULL
);

-- Theater Table
CREATE TABLE "Theater" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "location" TEXT,
    "cityId" UUID NOT NULL REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Screen Table
CREATE TABLE "Screen" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "number" INTEGER NOT NULL,
    "theaterId" UUID NOT NULL REFERENCES "Theater"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE ("theaterId", "number")
);

-- Seat Table
CREATE TABLE "Seat" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "row" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "SeatType" NOT NULL,
    "screenId" UUID NOT NULL REFERENCES "Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE ("screenId", "row", "number")
);

-- Movie Table
CREATE TABLE "Movie" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "poster" TEXT,
    "genre" TEXT[] NOT NULL,
    "language" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Show Table
CREATE TABLE "Show" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "movieId" UUID NOT NULL REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "screenId" UUID NOT NULL REFERENCES "Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "startTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ShowSeatPrice Table
CREATE TABLE "ShowSeatPrice" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "showId" UUID NOT NULL REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "type" "SeatType" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    UNIQUE ("showId", "type")
);

-- Booking Table
CREATE TABLE "Booking" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "showId" UUID NOT NULL REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "status" "BookingStatus" DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- BookedSeat Table
CREATE TABLE "BookedSeat" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "seatId" UUID NOT NULL REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE ("bookingId", "seatId")
);

-- Payment Table
CREATE TABLE "Payment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "amount" DECIMAL(65,30) NOT NULL,
    "provider" TEXT NOT NULL,
    "referenceId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
