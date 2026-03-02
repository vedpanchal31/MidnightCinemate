import { NextRequest, NextResponse } from "next/server";
import { getUnreadNotificationCount } from "@/lib/database/db-service";
import { verifyJWTToken } from "@/lib/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "user_id is required" },
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

    if (payload.userId !== user_id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const count = await getUnreadNotificationCount(user_id);
    return NextResponse.json({ success: true, unread_count: count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
