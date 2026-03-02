import { NextRequest, NextResponse } from "next/server";
import { getBookingSummaryByIds } from "@/lib/database/db-service";
import { verifyJWTToken } from "@/lib/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id") || "";
    const bookingIdsParam = searchParams.get("booking_ids") || "";

    if (!bookingIdsParam) {
      return NextResponse.json(
        { success: false, message: "booking_ids is required" },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authorization token is required" },
        { status: 401 },
      );
    }

    const payload = verifyJWTToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    if (user_id && payload.userId !== user_id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const bookingIds = bookingIdsParam
      .split(",")
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));

    if (!bookingIds.length) {
      return NextResponse.json(
        { success: false, message: "booking_ids is invalid" },
        { status: 400 },
      );
    }

    const summary = await getBookingSummaryByIds(bookingIds);
    if (!summary) {
      return NextResponse.json(
        { success: false, message: "Booking summary not found" },
        { status: 404 },
      );
    }

    if (String(summary.user_id) !== String(payload.userId)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching booking summary:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
