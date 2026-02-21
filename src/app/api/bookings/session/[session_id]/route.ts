/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";
import { updateBookingStatusBySession } from "@/lib/database/db-service";
import { BookingStatus } from "@/lib/database/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    // Fallback sync in case webhook was missed (common in local dev).
    // This ensures paid sessions are reflected as CONFIRMED in history.
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        await updateBookingStatusBySession(
          session_id,
          BookingStatus.CONFIRMED,
          session.payment_intent ? String(session.payment_intent) : undefined,
        );
      } else if (session.status === "expired") {
        await updateBookingStatusBySession(session_id, BookingStatus.EXPIRED);
      }
    } catch (syncError) {
      console.warn("Stripe sync skipped for session:", session_id, syncError);
    }

    // Aggregate booking rows by stripe_session_id into a single payload
    const result = await db.query(
      `
      SELECT 
        MIN(mb.id) AS id,
        mb.user_id,
        mb.tmdb_movie_id,
        mb.show_date,
        mb.show_time,
        mb.timeslot_id,
        ARRAY_REMOVE(ARRAY_AGG(bs.seat_id ORDER BY bs.seat_id), NULL) AS seat_ids,
        SUM(mb.price)::numeric(10,2) AS amount,
        MIN(mb.status) AS status,
        MIN(mb.created_at) AS created_at
      FROM "MovieBooking" mb
      LEFT JOIN "BookingSeat" bs ON bs.booking_id = mb.id
      WHERE mb.stripe_session_id = $1
      GROUP BY mb.user_id, mb.tmdb_movie_id, mb.show_date, mb.show_time, mb.timeslot_id
      ORDER BY MIN(mb.created_at) DESC
      LIMIT 1
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
