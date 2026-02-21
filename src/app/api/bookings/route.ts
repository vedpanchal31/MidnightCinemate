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
    const isDuplicateSeatConstraint =
      error?.code === "23505" ||
      message.includes("duplicate key value") ||
      message.includes("idx_booking_seat_active_unique") ||
      message.includes("idx_movie_booking_active_seat_unique") ||
      message.includes("unique_movie_slot_seat");
    const conflictMessages = [
      "Seats already taken",
      "Not enough seats available",
      "Time slot does not belong to this movie",
      "Selected date does not match the time slot",
      "Selected time does not match the time slot",
      "Selected time slot is not active",
      "Invalid timeslot_id",
      "Duplicate seats selected",
    ];
    const isConflict =
      isDuplicateSeatConstraint ||
      conflictMessages.some((entry) => message.includes(entry));
    const normalizedMessage = isDuplicateSeatConstraint
      ? "Seats already taken"
      : message;

    return NextResponse.json(
      {
        success: false,
        message: isConflict ? normalizedMessage : "Internal server error",
        error: error.message,
        detail: error.detail, // Useful for Postgres errors like constraint violations
      },
      { status: isConflict ? 409 : 500 },
    );
  }
}
