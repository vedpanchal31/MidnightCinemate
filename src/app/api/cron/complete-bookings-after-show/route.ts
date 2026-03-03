import { NextRequest, NextResponse } from "next/server";
import { completeBookingsAfterShow } from "@/lib/database/db-service";

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

    const completedCount = await completeBookingsAfterShow();
    return NextResponse.json({
      success: true,
      message: "Completed bookings after show job completed",
      completed_count: completedCount,
    });
  } catch (error) {
    console.error("Error completing bookings after show:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
