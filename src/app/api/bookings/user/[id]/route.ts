import { NextRequest, NextResponse } from "next/server";
import {
  expirePendingBookingsBeforeShow,
  getBookingsByUser,
} from "@/lib/database/db-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 },
      );
    }

    await expirePendingBookingsBeforeShow();
    const bookings = await getBookingsByUser(id);

    return NextResponse.json({
      success: true,
      message: "User bookings retrieved successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
