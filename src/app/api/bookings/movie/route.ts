import { NextRequest, NextResponse } from "next/server";
import { getBookingsByMovieAndTime } from "@/lib/database/db-service";
import { BookingStatus } from "@/lib/database/schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdb_movie_id = searchParams.get("tmdb_movie_id");
    const show_date = searchParams.get("show_date");
    const show_time = searchParams.get("show_time");

    if (!tmdb_movie_id || !show_date || !show_time) {
      return NextResponse.json(
        { success: false, message: "Missing required query parameters" },
        { status: 400 },
      );
    }

    const bookings = await getBookingsByMovieAndTime(
      parseInt(tmdb_movie_id),
      show_date,
      show_time,
    );

    return NextResponse.json({
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
