/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/database/db-service";
import { CreateBookingRequest } from "@/lib/database/schema";
import moment from "moment";

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

    // Ensure stored date/time are in UTC
    const utcDateTime = moment(`${body.show_date} ${body.show_time}`)
      .utc()
      .format();

    if (utcDateTime === "Invalid date") {
      return NextResponse.json(
        { success: false, message: "Invalid date or time format" },
        { status: 400 },
      );
    }

    body.show_date = utcDateTime.split("T")[0];
    body.show_time = utcDateTime.split("T")[1].replace("Z", "");

    const bookings = await createBooking(body);
    return NextResponse.json({
      success: true,
      message: "Booking confirmed successfully",
      data: bookings,
    });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
        detail: error.detail, // Useful for Postgres errors like constraint violations
      },
      { status: 500 },
    );
  }
}
