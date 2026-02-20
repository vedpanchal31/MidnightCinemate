/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createBooking,
  ensureTimeSlotInfrastructure,
  ensureTimeSlotsForMovie,
} from "@/lib/database/db-service";
import { BookingStatus } from "@/lib/database/schema";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tmdb_movie_id,
      show_date,
      show_time,
      timeslot_id,
      seat_ids,
      amount,
      movie_title,
      user_id,
      user_email,
      booking_ids,
    } = body;

    const normalizedBookingIds: number[] = Array.isArray(booking_ids)
      ? booking_ids
          .map((id: unknown) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [];

    let effectiveMovieId = tmdb_movie_id;
    let effectiveShowDate = show_date;
    let effectiveShowTime = show_time;
    let effectiveTimeslotId = timeslot_id;
    let effectiveSeatIds: string[] = Array.isArray(seat_ids) ? seat_ids : [];
    let effectiveAmount = amount;

    // Use pre-created pending bookings if supplied.
    if (normalizedBookingIds.length > 0) {
      const pendingRows = await db.query(
        `SELECT id, user_id, tmdb_movie_id, show_date, show_time, timeslot_id, seat_id, price, status
         FROM "MovieBooking"
         WHERE id = ANY($1)
         ORDER BY id ASC`,
        [normalizedBookingIds],
      );

      if (pendingRows.rows.length !== normalizedBookingIds.length) {
        return NextResponse.json(
          { success: false, message: "Some bookings were not found" },
          { status: 404 },
        );
      }

      const first = pendingRows.rows[0];
      if (!first) {
        return NextResponse.json(
          { success: false, message: "No pending bookings found" },
          { status: 404 },
        );
      }

      const statusMismatch = pendingRows.rows.some(
        (row) => Number(row.status) !== BookingStatus.PENDING_PAYMENT,
      );
      if (statusMismatch) {
        return NextResponse.json(
          {
            success: false,
            message: "Some seats are no longer pending for payment",
          },
          { status: 409 },
        );
      }

      const mixedBookings = pendingRows.rows.some(
        (row) =>
          Number(row.tmdb_movie_id) !== Number(first.tmdb_movie_id) ||
          String(row.show_date).slice(0, 10) !==
            String(first.show_date).slice(0, 10) ||
          String(row.show_time) !== String(first.show_time) ||
          String(row.timeslot_id) !== String(first.timeslot_id),
      );
      if (mixedBookings) {
        return NextResponse.json(
          {
            success: false,
            message: "Pending seats must belong to same show and movie",
          },
          { status: 400 },
        );
      }

      const expectedUserId = user_id || "guest";
      const wrongUser = pendingRows.rows.some(
        (row) => String(row.user_id || "guest") !== String(expectedUserId),
      );
      if (wrongUser) {
        return NextResponse.json(
          { success: false, message: "Pending booking ownership mismatch" },
          { status: 403 },
        );
      }

      const showStart = new Date(
        `${String(first.show_date).slice(0, 10)}T${String(first.show_time)}Z`,
      );
      const now = new Date();
      const oneHourBefore = new Date(showStart.getTime() - 60 * 60 * 1000);
      if (now >= oneHourBefore) {
        await db.query(
          `UPDATE "MovieBooking"
           SET status = $1
           WHERE id = ANY($2) AND status = $3`,
          [
            BookingStatus.EXPIRED,
            normalizedBookingIds,
            BookingStatus.PENDING_PAYMENT,
          ],
        );
        return NextResponse.json(
          { success: false, message: "Payment window expired for this show" },
          { status: 409 },
        );
      }

      effectiveMovieId = Number(first.tmdb_movie_id);
      effectiveShowDate = String(first.show_date).slice(0, 10);
      effectiveShowTime = String(first.show_time);
      effectiveTimeslotId = String(first.timeslot_id);
      effectiveSeatIds = pendingRows.rows.map((row) => String(row.seat_id));
      effectiveAmount = pendingRows.rows.reduce(
        (sum, row) => sum + Number(row.price || 0),
        0,
      );
    } else {
      // Backward compatible path: create pending booking on checkout.
      if (
        !tmdb_movie_id ||
        !show_date ||
        !show_time ||
        !timeslot_id ||
        !seat_ids ||
        !amount
      ) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 },
        );
      }

      await ensureTimeSlotInfrastructure();
      await ensureTimeSlotsForMovie(tmdb_movie_id, show_date, show_date);

      const bookings = await createBooking({
        user_id: user_id || "guest",
        tmdb_movie_id,
        show_date,
        show_time,
        timeslot_id,
        seat_ids,
        amount,
      });
      normalizedBookingIds.push(...bookings.map((booking) => booking.id));
    }

    // Create Stripe session for the pending booking.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: movie_title || "Movie Ticket",
              description: `${movie_title} - ${effectiveShowDate} at ${effectiveShowTime} (Seats: ${effectiveSeatIds.join(", ")})`,
            },
            unit_amount: Math.round(effectiveAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/booking/cancel`,
      customer_email: user_email,
      metadata: {
        user_id: user_id || "guest",
        tmdb_movie_id: effectiveMovieId.toString(),
        show_date: effectiveShowDate,
        show_time: effectiveShowTime,
        timeslot_id: effectiveTimeslotId,
        seat_ids: effectiveSeatIds.join(","),
        amount: effectiveAmount.toString(),
      },
    });

    // Attach session id to all pending booking rows.
    await db.query(
      'UPDATE "MovieBooking" SET stripe_session_id = $1 WHERE id = ANY($2)',
      [session.id, normalizedBookingIds],
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
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
      { success: false, message: isConflict ? message : error.message },
      { status: isConflict ? 409 : 500 },
    );
  }
}
