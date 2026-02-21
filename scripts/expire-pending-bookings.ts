import dotenv from "dotenv";
dotenv.config();

import { expirePendingBookingsBeforeShow } from "@/lib/database/db-service";

async function run() {
  try {
    const expiredCount = await expirePendingBookingsBeforeShow();
    console.log(
      `[cron] expire-pending-bookings completed. expired_count=${expiredCount}`,
    );
    process.exit(0);
  } catch (error) {
    console.error("[cron] expire-pending-bookings failed:", error);
    process.exit(1);
  }
}

run();
