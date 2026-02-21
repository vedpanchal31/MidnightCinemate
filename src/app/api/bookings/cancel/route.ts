import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { BookingStatus } from "@/lib/database/schema";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user_id = String(body.user_id || "").trim();
    const booking_ids = Array.isArray(body.booking_ids)
      ? body.booking_ids
          .map((id: unknown) => Number(id))
          .filter((id: number) => !Number.isNaN(id))
      : [];

    if (!user_id || booking_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "user_id and booking_ids are required" },
        { status: 400 },
      );
    }

    const bookingsResult = await db.query(
      `SELECT id, status, stripe_payment_id, price
       FROM "MovieBooking"
       WHERE user_id = $1
         AND id = ANY($2)
         AND status IN ($3, $4)`,
      [
        user_id,
        booking_ids,
        BookingStatus.PENDING_PAYMENT,
        BookingStatus.CONFIRMED,
      ],
    );

    const eligibleBookings = bookingsResult.rows as Array<{
      id: number;
      status: number;
      stripe_payment_id: string | null;
      price: number | string;
    }>;

    if (eligibleBookings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No eligible bookings found to cancel",
        },
        { status: 409 },
      );
    }

    const pendingBookingIds = eligibleBookings
      .filter((booking) => booking.status === BookingStatus.PENDING_PAYMENT)
      .map((booking) => booking.id);
    const confirmedBookings = eligibleBookings.filter(
      (booking) => booking.status === BookingStatus.CONFIRMED,
    );

    const confirmedWithoutPaymentId = confirmedBookings.filter(
      (booking) => !booking.stripe_payment_id,
    );
    if (confirmedWithoutPaymentId.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Some confirmed bookings are missing payment reference and cannot be refunded",
        },
        { status: 409 },
      );
    }

    if (confirmedBookings.length > 0 && !stripe) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Stripe is not configured. Unable to process refund for confirmed bookings",
        },
        { status: 500 },
      );
    }

    const refundAmountByPaymentIntent = new Map<string, number>();
    confirmedBookings.forEach((booking) => {
      const paymentIntent = booking.stripe_payment_id as string;
      const seatPricePaise = Math.round(Number(booking.price) * 100);
      refundAmountByPaymentIntent.set(
        paymentIntent,
        (refundAmountByPaymentIntent.get(paymentIntent) || 0) + seatPricePaise,
      );
    });

    for (const [
      paymentIntent,
      amount,
    ] of refundAmountByPaymentIntent.entries()) {
      await stripe!.refunds.create({
        payment_intent: paymentIntent,
        amount,
      });
    }

    const refundedBookingIds = confirmedBookings.map((booking) => booking.id);

    if (refundedBookingIds.length > 0) {
      await db.query(
        `UPDATE "MovieBooking"
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2
           AND id = ANY($3)`,
        [BookingStatus.REFUNDED, user_id, refundedBookingIds],
      );
      await db.query(
        `UPDATE "BookingSeat"
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = ANY($2)`,
        [BookingStatus.REFUNDED, refundedBookingIds],
      );
    }

    if (pendingBookingIds.length > 0) {
      await db.query(
        `UPDATE "MovieBooking"
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2
           AND id = ANY($3)`,
        [BookingStatus.CANCELLED, user_id, pendingBookingIds],
      );
      await db.query(
        `UPDATE "BookingSeat"
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = ANY($2)`,
        [BookingStatus.CANCELLED, pendingBookingIds],
      );
    }

    return NextResponse.json({
      success: true,
      message:
        refundedBookingIds.length > 0
          ? "Booking cancelled and refund initiated successfully"
          : "Booking cancelled successfully",
      cancelled_count: pendingBookingIds.length,
      refunded_count: refundedBookingIds.length,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
