import { NextRequest, NextResponse } from "next/server";
import { getTimeSlotsByMovie } from "@/lib/database/db-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdb_movie_id = searchParams.get("tmdb_movie_id");
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");

    if (!tmdb_movie_id) {
      return NextResponse.json(
        { success: false, message: "tmdb_movie_id is required" },
        { status: 400 },
      );
    }

    // Get available time slots for specific movie
    const timeSlots = await getTimeSlotsByMovie(
      parseInt(tmdb_movie_id),
      date_from || undefined,
      date_to || undefined,
    );

    return NextResponse.json({
      success: true,
      message: "Time slots retrieved successfully",
      data: timeSlots,
    });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
