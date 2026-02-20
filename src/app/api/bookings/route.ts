/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import {
  createBooking,
  ensureTimeSlotInfrastructure,
  ensureTimeSlotsForMovie,
} from "@/lib/database/db-service";
import { CreateBookingRequest } from "@/lib/database/schema";

export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingRequest = await request.json();

    // Validate required fields
    if (
      !body.tmdb_movie_id ||
      !body.show_date ||
      !body.show_time ||
      !body.seat_ids ||
      body.seat_ids.length === 0 ||
      !body.amount ||
      !body.timeslot_id
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Runtime bootstrap for new TMDB ids
    await ensureTimeSlotInfrastructure();
    await ensureTimeSlotsForMovie(
      body.tmdb_movie_id,
      body.show_date,
      body.show_date,
    );

    const bookings = await createBooking(body);
    return NextResponse.json({
      success: true,
      message: "Booking confirmed successfully",
      data: bookings,
    });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    const message = error?.message || "Internal server error";
    const conflictMessages = [
      "Seats already taken",
      "Not enough seats available",
      "Time slot does not belong to this movie",
      "Selected date does not match the time slot",
      "Selected time does not match the time slot",
      "Selected time slot is not active",
      "Invalid timeslot_id",
    ];
    const isConflict = conflictMessages.some((entry) =>
      message.includes(entry),
    );

    return NextResponse.json(
      {
        success: false,
        message: isConflict ? message : "Internal server error",
        error: error.message,
        detail: error.detail, // Useful for Postgres errors like constraint violations
      },
      { status: isConflict ? 409 : 500 },
    );
  }
}
