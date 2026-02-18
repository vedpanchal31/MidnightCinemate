/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createBooking } from "@/lib/database/db-service";
import { BookingStatus } from "@/lib/database/schema";

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
    } = body;

    // 1. Basic validation
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

    // 2. Create Stripe Checkout Session FIRST to get the ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: movie_title || "Movie Ticket",
              description: `${movie_title} - ${show_date} at ${show_time} (Seats: ${seat_ids.join(", ")})`,
            },
            unit_amount: Math.round(amount * 100), // Amount in paise for INR
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
        tmdb_movie_id: tmdb_movie_id.toString(),
        show_date,
        show_time,
        timeslot_id,
        seat_ids: seat_ids.join(","),
        amount: amount.toString(),
      },
    });

    // 3. Create a PENDING booking in our database with the stripe_session_id
    // This allows the user to see it in their history even if they don't pay immediately
    try {
      const bookings = await createBooking({
        user_id: user_id || "guest",
        tmdb_movie_id,
        show_date,
        show_time,
        timeslot_id,
        seat_ids,
        amount,
      });

      // Update the session ID for these bookings so we can match it in the webhook
      const { db } = await import("@/lib/db");
      await db.query(
        'UPDATE "MovieBooking" SET stripe_session_id = $1 WHERE id = ANY($2)',
        [session.id, bookings.map((b) => b.id)],
      );
    } catch (dbError: any) {
      console.error("Database pre-booking error:", dbError);
      // We don't fail the whole request if pre-booking fails, but ideally it should work
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
