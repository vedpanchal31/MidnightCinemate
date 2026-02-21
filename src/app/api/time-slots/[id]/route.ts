import { NextRequest, NextResponse } from "next/server";
import {
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} from "@/lib/database/db-service";
import { UpdateTimeSlotRequest } from "@/lib/database/schema";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { params } = context;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Time slot ID is required" },
        { status: 400 },
      );
    }

    const timeSlot = await getTimeSlotById(id);

    if (!timeSlot) {
      return NextResponse.json(
        { success: false, message: "Time slot not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Time slot retrieved successfully",
      data: timeSlot,
    });
  } catch (error) {
    console.error("Error fetching time slot:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { params } = context;
    const { id } = await params;
    const body: UpdateTimeSlotRequest = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Time slot ID is required" },
        { status: 400 },
      );
    }

    // Check if time slot exists
    const existingSlot = await getTimeSlotById(id);
    if (!existingSlot) {
      return NextResponse.json(
        { success: false, message: "Time slot not found" },
        { status: 404 },
      );
    }

    // Validate total seats if provided
    if (body.total_seats !== undefined) {
      if (isNaN(body.total_seats) || body.total_seats <= 0) {
        return NextResponse.json(
          { success: false, message: "Total seats must be a positive number" },
          { status: 400 },
        );
      }
    }

    // Validate available seats if provided
    if (body.available_seats !== undefined) {
      if (isNaN(body.available_seats) || body.available_seats < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Available seats must be a non-negative number",
          },
          { status: 400 },
        );
      }

      // Make sure available seats don't exceed total seats
      const totalSeats = body.total_seats || existingSlot.total_seats;
      if (body.available_seats > totalSeats) {
        return NextResponse.json(
          {
            success: false,
            message: "Available seats cannot exceed total seats",
          },
          { status: 400 },
        );
      }
    }

    // Validate price if provided
    if (body.price !== undefined) {
      if (isNaN(body.price) || body.price <= 0) {
        return NextResponse.json(
          { success: false, message: "Price must be a positive number" },
          { status: 400 },
        );
      }
    }

    // Validate screen type if provided
    if (body.screen_type !== undefined) {
      const validScreenTypes = ["2D", "3D", "IMAX", "4DX"];
      if (!validScreenTypes.includes(body.screen_type)) {
        return NextResponse.json(
          { success: false, message: "Invalid screen type" },
          { status: 400 },
        );
      }
    }

    const updatedTimeSlot = await updateTimeSlot(id, body);

    if (!updatedTimeSlot) {
      return NextResponse.json(
        { success: false, message: "Failed to update time slot" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Time slot updated successfully",
      data: updatedTimeSlot,
    });
  } catch (error) {
    console.error("Error updating time slot:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { params } = context;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Time slot ID is required" },
        { status: 400 },
      );
    }

    // Check if time slot exists
    const existingSlot = await getTimeSlotById(id);
    if (!existingSlot) {
      return NextResponse.json(
        { success: false, message: "Time slot not found" },
        { status: 404 },
      );
    }

    const deleted = await deleteTimeSlot(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Failed to delete time slot" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Time slot deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting time slot:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
