/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> },
) {
  try {
    const { session_id } = await params;

    if (!session_id) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 },
      );
    }

    // Query bookings by stripe_session_id
    const result = await db.query(
      `
      SELECT 
        mb.id,
        mb.user_id,
        mb.tmdb_movie_id,
        mb.show_date,
        mb.show_time,
        mb.seat_ids,
        mb.amount,
        mb.status,
        mb.created_at,
        m.title as movie_title
      FROM "MovieBooking" mb
      LEFT JOIN movies m ON mb.tmdb_movie_id = m.id
      WHERE mb.stripe_session_id = $1
      ORDER BY mb.created_at DESC
    `,
      [session_id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "No booking found for this session" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error fetching booking by session ID:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
