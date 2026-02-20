import { NextRequest, NextResponse } from "next/server";
import { cancelBookingsByIds } from "@/lib/database/db-service";

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

    const cancelledCount = await cancelBookingsByIds(user_id, booking_ids);
    if (cancelledCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No eligible bookings found to cancel",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      cancelled_count: cancelledCount,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
