import { NextRequest, NextResponse } from "next/server";
import { createGiftBooking, getGiftBookings, updateGiftStatus } from "@/lib/store";
import { isValidBDPhone } from "@/lib/utils";

// Allowed Range: 21 November 2026 to 06 December 2026 (Excluding Fridays)
const MIN_DATE = "2026-11-21";
const MAX_DATE = "2026-12-06";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, mobileNumber, department, batch, shortAddress, visitDate, visitTimeSlot, customTime } = body;

    // 1. Validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your full legal name." },
        { status: 400 }
      );
    }

    if (!mobileNumber || typeof mobileNumber !== "string" || !isValidBDPhone(mobileNumber)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid Bangladeshi mobile number (e.g. 01712345678)." },
        { status: 400 }
      );
    }

    if (!visitDate || typeof visitDate !== "string") {
      return NextResponse.json(
        { success: false, error: "Please select your preferred visit date." },
        { status: 400 }
      );
    }

    // Strict 15-Day Date Range Check (Excluding Fridays)
    if (visitDate < MIN_DATE || visitDate > MAX_DATE) {
      return NextResponse.json(
        {
          success: false,
          error: "Visit date must be strictly between 21 November and 06 December 2026.",
        },
        { status: 400 }
      );
    }

    if (visitDate === "2026-11-27" || visitDate === "2026-12-04") {
      return NextResponse.json(
        {
          success: false,
          error: "Head Office is closed on Fridays. Please select a visit date between Saturday and Thursday.",
        },
        { status: 400 }
      );
    }

    const timeSlot = customTime?.trim() || visitTimeSlot?.trim() || "Flexible / Anytime";

    const result = await createGiftBooking({
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      department: department?.trim(),
      batch: batch?.trim(),
      shortAddress: shortAddress?.trim(),
      visitDate,
      visitTimeSlot: timeSlot,
      customTime: customTime?.trim(),
    });

    if (!result.success || !result.booking) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to confirm gift booking." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Head office visit booking confirmed! Show this pass to claim your gift.",
      booking: result.booking,
    });
  } catch (error: any) {
    console.error("API /api/gift error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("date");
    const statusFilter = searchParams.get("status");

    const bookings = await getGiftBookings();

    let filtered = bookings;
    if (dateFilter) {
      filtered = filtered.filter((b) => b.visitDate === dateFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    const todayStr = "2026-11-21"; // default to event start
    const todayCount = bookings.filter((b) => b.visitDate === todayStr).length;
    const handedCount = bookings.filter((b) => b.status === "gift_handed").length;

    return NextResponse.json({
      success: true,
      total: bookings.length,
      todayCount,
      handedCount,
      bookings: filtered,
    });
  } catch (error: any) {
    console.error("API GET /api/gift error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !["confirmed", "gift_handed", "cancelled"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid booking ID or status." }, { status: 400 });
    }

    const updated = await updateGiftStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update status." }, { status: 500 });
  }
}
