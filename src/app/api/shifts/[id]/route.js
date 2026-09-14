import { connectDB } from "@/lib/db";
import { getSession, jsonError } from "@/lib/auth";
import { isValidISODate, isValidTime } from "@/lib/dates";
import { SHIFT_TYPES } from "@/lib/shifts";
import { serializeShift } from "@/lib/shiftDto";
import Shift from "@/models/Shift";

export const runtime = "nodejs";

async function findOwnShift(id, userId) {
  if (!id?.match(/^[a-f\d]{24}$/i)) return null;
  return Shift.findOne({ _id: id, userId });
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const { id } = await params;
    await connectDB();
    const shift = await findOwnShift(id, session.userId);
    if (!shift) return jsonError("Shift not found.", 404);

    const body = await request.json();

    if (body.date !== undefined) {
      if (!isValidISODate(body.date)) return jsonError("A valid date is required.");
      shift.date = body.date;
    }
    if (body.type !== undefined) {
      if (!SHIFT_TYPES[body.type]) return jsonError("Choose a day, evening, or night shift.");
      shift.type = body.type;
    }
    if (body.startTime !== undefined) {
      if (!isValidTime(body.startTime)) return jsonError("Start time must use HH:MM.");
      shift.startTime = body.startTime;
    }
    if (body.endTime !== undefined) {
      if (!isValidTime(body.endTime)) return jsonError("End time must use HH:MM.");
      shift.endTime = body.endTime;
    }
    if (body.unit !== undefined) shift.unit = String(body.unit).trim();
    if (body.notes !== undefined) shift.notes = String(body.notes).trim();
    if (body.calledInSick !== undefined) shift.calledInSick = Boolean(body.calledInSick);

    await shift.save();
    return Response.json({ shift: serializeShift(shift) });
  } catch (error) {
    console.error(error);
    return jsonError("Could not update the shift.", 500);
  }
}

export async function DELETE(_request, { params }) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const { id } = await params;
    await connectDB();
    const shift = await findOwnShift(id, session.userId);
    if (!shift) return jsonError("Shift not found.", 404);

    await shift.deleteOne();
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonError("Could not delete the shift.", 500);
  }
}
