import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationsByUser,
  markAllNotificationsRead,
  markNotificationRead,
  deleteAllNotifications,
  deleteNotification,
} from "@/lib/database/db-service";
import { verifyJWTToken } from "@/lib/utils/auth";

const getAuthorizedUserId = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  if (!token) {
    return { error: "Authorization token is required", status: 401 };
  }

  const payload = verifyJWTToken(token);
  if (!payload) {
    return { error: "Invalid or expired token", status: 401 };
  }

  return { userId: payload.userId };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const limit = Number(searchParams.get("limit") || 20);
    const offset = Number(searchParams.get("offset") || 0);

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "user_id is required" },
        { status: 400 },
      );
    }

    const auth = getAuthorizedUserId(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status },
      );
    }
    if (auth.userId !== user_id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const notifications = await getNotificationsByUser(
      user_id,
      Math.min(Math.max(limit, 1), 50),
      Math.max(offset, 0),
    );

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const user_id = String(body.user_id || "");
    const notification_id = Number(body.notification_id || 0);
    const mark_all = Boolean(body.mark_all);
    const delete_all = Boolean(body.delete_all);
    const delete_one = Boolean(body.delete_one);

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "user_id is required" },
        { status: 400 },
      );
    }

    const auth = getAuthorizedUserId(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status },
      );
    }
    if (auth.userId !== user_id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    if (delete_all) {
      const deleted = await deleteAllNotifications(user_id);
      return NextResponse.json({
        success: true,
        deleted,
        message:
          deleted > 0 ? "Notifications cleared." : "No notifications to clear.",
      });
    }

    if (delete_one) {
      if (!notification_id) {
        return NextResponse.json(
          { success: false, message: "notification_id is required" },
          { status: 400 },
        );
      }

      const deleted = await deleteNotification(user_id, notification_id);
      return NextResponse.json({
        success: true,
        deleted,
        message: deleted ? "Notification deleted." : "Notification not found.",
      });
    }

    if (mark_all) {
      const updated = await markAllNotificationsRead(user_id);
      return NextResponse.json({
        success: true,
        updated,
        message:
          updated > 0
            ? "All notifications marked as read."
            : "No unread notifications.",
      });
    }

    if (!notification_id) {
      return NextResponse.json(
        { success: false, message: "notification_id is required" },
        { status: 400 },
      );
    }

    const updated = await markNotificationRead(user_id, notification_id);
    return NextResponse.json({
      success: true,
      updated,
      message: updated
        ? "Notification marked as read."
        : "Notification not found.",
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
