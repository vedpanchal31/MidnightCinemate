import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { BookingStatus } from "@/lib/database/schema";
import {
  updateBookingStatusBySession,
  createPayment,
} from "@/lib/database/db-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", errorMessage);
    return NextResponse.json(
      { success: false, message: "Invalid signature" },
      { status: 400 },
    );
  }

  // Handle the event
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // 1. Create Payment record for history
      await createPayment({
        stripe_session_id: session.id,
        stripe_payment_id: session.payment_intent as string,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || "inr",
        status: session.payment_status,
        payment_method: session.payment_method_types?.[0] || "card",
      });

      // 2. Update Booking status to CONFIRMED
      if (session.payment_status === "paid") {
        const success = await updateBookingStatusBySession(
          session.id,
          BookingStatus.CONFIRMED,
          session.payment_intent as string,
        );

        if (success) {
          // If the booking was pre-created, we might need to update availability here
          // if it wasn't done at creation/lock time.
          // But according to the new flow, we might want to do it in createBooking or here.
          // The previous code did it here.

          const metadata = session.metadata;
          if (metadata && metadata.timeslot_id && metadata.seat_ids) {
            const seats = metadata.seat_ids.split(",");
            await db.query(
              'UPDATE "Timeslot" SET available_seats = available_seats - $1 WHERE id = $2',
              [seats.length, metadata.timeslot_id],
            );
          }

          console.log(`Booking confirmed for session ${session.id}`);
        }
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await updateBookingStatusBySession(session.id, BookingStatus.EXPIRED);
      console.log(`Booking expired for session ${session.id}`);
    } else if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      // Note: We'd need a way to map intent to session if we want to update by session,
      // or we can just let expired handle it if we don't have the mapping.
    }
  } catch (err) {
    console.error("Error processing webhook event:", err);
    return NextResponse.json(
      { success: false, message: "Internal processing error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// Next.js config to disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};
Maryland;
