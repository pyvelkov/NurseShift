import { connectDB } from "@/lib/db";
import { getSession, jsonError } from "@/lib/auth";
import { isValidISODate } from "@/lib/dates";
import { serializeShift } from "@/lib/shiftDto";
import Shift from "@/models/Shift";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const { id } = await params;
    if (!id?.match(/^[a-f\d]{24}$/i)) return jsonError("Shift not found.", 404);

    const body = await request.json();
    const newDate = String(body.newDate || "");
    const swappedWith = String(body.swappedWith || "").trim();
    const note = String(body.note || "").trim();

    if (!isValidISODate(newDate)) return jsonError("Choose the new shift date.");
    if (swappedWith.length < 2) {
      return jsonError("Enter the name of the coworker you swapped with.");
    }

    await connectDB();
    const shift = await Shift.findOne({ _id: id, userId: session.userId });
    if (!shift) return jsonError("Shift not found.", 404);
    if (shift.date === newDate) {
      return jsonError("Pick a different date than the current one.");
    }

    const fromDate = shift.date;
    if (!shift.originalDate) {
      shift.originalDate = fromDate;
    }

    shift.swapHistory.push({
      fromDate,
      toDate: newDate,
      swappedWith,
      note,
      at: new Date(),
    });
    shift.date = newDate;
    shift.swappedWith = swappedWith;
    if (note) {
      shift.notes = shift.notes ? `${shift.notes}\nSwap note: ${note}` : `Swap note: ${note}`;
    }

    await shift.save();
    return Response.json({ shift: serializeShift(shift) });
  } catch (error) {
    console.error(error);
    return jsonError("Could not reschedule the shift.", 500);
  }
}
