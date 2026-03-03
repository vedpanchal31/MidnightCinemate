import { completeBookingsAfterShow } from "../src/lib/database/db-service";

async function testCompleteBookings() {
  console.log("🎬 Testing complete bookings after show...");

  try {
    const completedCount = await completeBookingsAfterShow();
    console.log(
      `✅ Completed ${completedCount} bookings that were past their show time`,
    );
    console.log("🎉 Bookings should now be marked as COMPLETED status");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testCompleteBookings();
