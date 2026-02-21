import { NextRequest, NextResponse } from "next/server";
import {
  ensureTimeSlotInfrastructure,
  ensureTimeSlotsForMovie,
  getTimeSlotsByMovie,
  logTimeSlotApiActivity,
} from "@/lib/database/db-service";

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

    const movieId = parseInt(tmdb_movie_id, 10);
    if (Number.isNaN(movieId) || movieId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid tmdb_movie_id" },
        { status: 400 },
      );
    }

    await ensureTimeSlotInfrastructure();
    await ensureTimeSlotsForMovie(
      movieId,
      date_from || undefined,
      date_to || undefined,
    );

    const timeSlots = await getTimeSlotsByMovie(
      movieId,
      date_from || undefined,
      date_to || undefined,
    );

    await logTimeSlotApiActivity({
      tmdb_movie_id: movieId,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
      request_payload: { tmdb_movie_id: movieId, date_from, date_to },
      response_count: timeSlots.length,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Time slots retrieved successfully",
      data: timeSlots,
    });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    const { searchParams } = new URL(request.url);
    const tmdb_movie_id = searchParams.get("tmdb_movie_id");
    const parsedMovieId = tmdb_movie_id ? parseInt(tmdb_movie_id, 10) : NaN;
    await ensureTimeSlotInfrastructure();
    await logTimeSlotApiActivity({
      tmdb_movie_id: Number.isNaN(parsedMovieId) ? undefined : parsedMovieId,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      request_payload: {
        tmdb_movie_id,
        date_from: searchParams.get("date_from"),
        date_to: searchParams.get("date_to"),
      },
      status: "error",
    });

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
