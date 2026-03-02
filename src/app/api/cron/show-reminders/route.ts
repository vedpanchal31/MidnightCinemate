import { NextRequest, NextResponse } from "next/server";
import {
  createNotificationOnce,
  getConfirmedBookingsInWindow,
} from "@/lib/database/db-service";

const CRON_SECRET = process.env.CRON_SECRET;

const sendWindow = async (
  startMinutes: number,
  endMinutes: number,
  type: string,
  title: string,
  message: string,
) => {
  const bookings = await getConfirmedBookingsInWindow(startMinutes, endMinutes);
  let sent = 0;
  for (const booking of bookings) {
    const result = await createNotificationOnce({
      user_id: String(booking.user_id),
      type,
      title,
      message,
      booking_id: booking.id,
      data: {
        booking_id: booking.id,
        tmdb_movie_id: booking.tmdb_movie_id,
        show_date: booking.show_date,
        show_time: booking.show_time,
      },
    });
    if (result) sent += 1;
  }
  return sent;
};

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

    const results = {
      reminder_24h: await sendWindow(
        24 * 60 - 15,
        24 * 60 + 15,
        "show_reminder_24h",
        "Show Reminder",
        "Your movie is tomorrow!",
      ),
      reminder_2h: await sendWindow(
        2 * 60 - 10,
        2 * 60 + 10,
        "show_reminder_2h",
        "Show Reminder",
        "Your show starts in 2 hours.",
      ),
      reminder_30m: await sendWindow(
        30 - 5,
        30 + 5,
        "show_reminder_30m",
        "Show Reminder",
        "Your show starts in 30 minutes.",
      ),
      starting_now: await sendWindow(
        -5,
        5,
        "show_starting_now",
        "Show Starting Now",
        "Your show is starting now!",
      ),
      missed: await sendWindow(
        15,
        30,
        "show_missed",
        "Show Missed",
        "You missed the show. We hope to see you next time.",
      ),
    };

    return NextResponse.json({
      success: true,
      message: "Show reminders processed",
      results,
    });
  } catch (error) {
    console.error("Error sending show reminders:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
