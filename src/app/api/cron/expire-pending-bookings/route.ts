import { NextRequest, NextResponse } from "next/server";
import { expirePendingBookingsBeforeShow } from "@/lib/database/db-service";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (CRON_SECRET) {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.replace("Bearer ", "");
      if (token !== CRON_SECRET) {
        return NextResponse.json(
          { success: false, message: "Unauthorized cron request" },
          { status: 401 },
        );
      }
    }

    const expiredCount = await expirePendingBookingsBeforeShow();
    return NextResponse.json({
      success: true,
      message: "Expired pending bookings job completed",
      expired_count: expiredCount,
    });
  } catch (error) {
    console.error("Error expiring pending bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
