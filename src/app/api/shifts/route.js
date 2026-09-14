import { connectDB } from "@/lib/db";
import { getSession, jsonError } from "@/lib/auth";
import { addDays, isValidISODate, isValidTime } from "@/lib/dates";
import { SHIFT_TYPES } from "@/lib/shifts";
import { serializeShift } from "@/lib/shiftDto";
import Shift from "@/models/Shift";

export const runtime = "nodejs";

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    await connectDB();

    const query = { userId: session.userId };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const start = `${month}-01`;
      const [year, monthNumber] = month.split("-").map(Number);
      const lastDay = new Date(year, monthNumber, 0).getDate();
      const end = `${month}-${String(lastDay).padStart(2, "0")}`;
      query.date = { $gte: addDays(start, -1), $lte: addDays(end, 1) };
    } else if (from && to && isValidISODate(from) && isValidISODate(to)) {
      query.date = { $gte: from, $lte: to };
    }

    const shifts = await Shift.find(query).sort({ date: 1, startTime: 1 });
    return Response.json({ shifts: shifts.map(serializeShift) });
  } catch (error) {
    console.error(error);
    return jsonError("Could not load shifts.", 500);
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const date = String(body.date || "");
    const type = String(body.type || "");
    const startTime = String(body.startTime || "");
    const endTime = String(body.endTime || "");
    const unit = String(body.unit || "").trim();
    const notes = String(body.notes || "").trim();
    const calledInSick = Boolean(body.calledInSick);

    if (!isValidISODate(date)) return jsonError("A valid date is required.");
    if (!SHIFT_TYPES[type]) return jsonError("Choose a day, evening, or night shift.");
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return jsonError("Start and end times must use HH:MM.");
    }

    await connectDB();
    const shift = await Shift.create({
      userId: session.userId,
      date,
      type,
      startTime,
      endTime,
      unit,
      notes,
      calledInSick,
    });

    return Response.json({ shift: serializeShift(shift) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError("Could not save the shift.", 500);
  }
}
