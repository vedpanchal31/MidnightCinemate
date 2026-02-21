import { NextRequest, NextResponse } from "next/server";
import {
  createTimeSlot,
  ensureTimeSlotInfrastructure,
  ensureTimeSlotsForMovie,
  getAllTimeSlots,
  getTimeSlotsByMovie,
  logTimeSlotApiActivity,
} from "@/lib/database/db-service";
import { CreateTimeSlotRequest, TimeSlotQuery } from "@/lib/database/schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdb_movie_id = searchParams.get("tmdb_movie_id");
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");
    const screen_type = searchParams.get("screen_type");

    // If tmdb_movie_id is provided, get slots for specific movie
    if (tmdb_movie_id) {
      const movieId = parseInt(tmdb_movie_id);
      if (isNaN(movieId)) {
        return NextResponse.json(
          { success: false, message: "Invalid TMDB movie ID" },
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
        request_payload: {
          tmdb_movie_id: movieId,
          date_from,
          date_to,
          screen_type,
        },
        response_count: timeSlots.length,
        status: "success",
      });
      return NextResponse.json({
        success: true,
        message: "Time slots retrieved successfully",
        data: timeSlots,
      });
    }

    // Otherwise, get all time slots with optional filters
    const query: TimeSlotQuery = {};
    if (date_from) query.date_from = date_from;
    if (date_to) query.date_to = date_to;
    if (screen_type)
      query.screen_type = screen_type as "2D" | "3D" | "IMAX" | "4DX";

    const timeSlots = await getAllTimeSlots(query);
    return NextResponse.json({
      success: true,
      message: "All time slots retrieved successfully",
      data: timeSlots,
    });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    const { searchParams } = new URL(request.url);
    const rawMovieId = searchParams.get("tmdb_movie_id");
    const parsedMovieId = rawMovieId ? parseInt(rawMovieId, 10) : NaN;
    await ensureTimeSlotInfrastructure();
    await logTimeSlotApiActivity({
      tmdb_movie_id: Number.isNaN(parsedMovieId) ? undefined : parsedMovieId,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      request_payload: {
        tmdb_movie_id: searchParams.get("tmdb_movie_id"),
        date_from: searchParams.get("date_from"),
        date_to: searchParams.get("date_to"),
        screen_type: searchParams.get("screen_type"),
      },
      status: "error",
    });

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTimeSlotRequest = await request.json();

    // Validate required fields
    if (
      !body.tmdb_movie_id ||
      !body.show_date ||
      !body.show_time ||
      !body.total_seats ||
      !body.price
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate TMDB movie ID
    if (isNaN(body.tmdb_movie_id) || body.tmdb_movie_id <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid TMDB movie ID" },
        { status: 400 },
      );
    }

    // Validate total seats
    if (isNaN(body.total_seats) || body.total_seats <= 0) {
      return NextResponse.json(
        { success: false, message: "Total seats must be a positive number" },
        { status: 400 },
      );
    }

    // Validate price
    if (isNaN(body.price) || body.price <= 0) {
      return NextResponse.json(
        { success: false, message: "Price must be a positive number" },
        { status: 400 },
      );
    }

    // Validate screen type
    const validScreenTypes = ["2D", "3D", "IMAX", "4DX"];
    if (!validScreenTypes.includes(body.screen_type)) {
      return NextResponse.json(
        { success: false, message: "Invalid screen type" },
        { status: 400 },
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.show_date)) {
      return NextResponse.json(
        { success: false, message: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 },
      );
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(body.show_time)) {
      return NextResponse.json(
        { success: false, message: "Invalid time format. Use HH:MM" },
        { status: 400 },
      );
    }

    const timeSlot = await createTimeSlot(body);
    return NextResponse.json(
      {
        success: true,
        message: "Time slot created successfully",
        data: timeSlot,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating time slot:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
