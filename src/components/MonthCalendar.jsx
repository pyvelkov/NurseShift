"use client";

import { addDays, getMonthGrid, spansOvernight, todayISO } from "@/lib/dates";
import { SHIFT_TYPES } from "@/lib/shifts";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function chipClass(shift) {
  if (shift.calledInSick) {
    return "bg-sick text-white line-through decoration-2";
  }
  if (shift.type === "night") return "bg-night-deep text-cream";
  if (shift.type === "evening") return "bg-evening text-cream";
  return "bg-day text-cream";
}

export default function MonthCalendar({ year, month, shifts, onSelectDay, onSelectShift }) {
  const cells = getMonthGrid(year, month);
  const today = todayISO();
  const byDate = new Map();
  const overnightByDate = new Map();

  for (const shift of shifts) {
    const list = byDate.get(shift.date) || [];
    list.push(shift);
    byDate.set(shift.date, list);

    if (spansOvernight(shift.startTime, shift.endTime, shift.type) && !shift.calledInSick) {
      const next = addDays(shift.date, 1);
      const overnight = overnightByDate.get(next) || [];
      overnight.push(shift);
      overnightByDate.set(next, overnight);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-cream sm:rounded-[1.75rem]">
      <div className="grid grid-cols-7 border-b border-line bg-paper/80">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-0 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-moss sm:px-2 sm:py-3 sm:text-xs"
          >
            <span className="sm:hidden">{day[0]}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayShifts = byDate.get(cell.iso) || [];
          const leftovers = overnightByDate.get(cell.iso) || [];
          const isToday = cell.iso === today;
          const hasNight =
            dayShifts.some((shift) => shift.type === "night" && !shift.calledInSick) || leftovers.length > 0;

          return (
            <div
              key={cell.iso}
              className={`relative min-h-[4.25rem] min-w-0 overflow-hidden border-t border-r border-line p-1 text-left hover:bg-paper sm:min-h-[7.5rem] sm:p-2 ${
                cell.inMonth ? "bg-cream" : "bg-paper/50 text-moss/60"
              } ${hasNight && cell.inMonth ? "bg-[linear-gradient(180deg,#eef0f8_0%,#faf6ee_42%)]" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelectDay(cell.iso)}
                className="absolute inset-0"
                aria-label={`Add shift on ${cell.iso}`}
              />
              <div className="relative z-10 pointer-events-none flex items-center justify-between gap-0.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs sm:h-7 sm:w-7 sm:text-sm ${
                    isToday ? "bg-pine font-semibold text-cream" : ""
                  }`}
                >
                  {cell.day}
                </span>
                {dayShifts.some((shift) => shift.originalDate) && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-night sm:text-[10px]">
                    ⇄
                  </span>
                )}
              </div>

              {leftovers.length > 0 && (
                <div className="relative z-10 pointer-events-none mt-1 truncate rounded-md bg-night/10 px-1 py-0.5 text-[9px] leading-tight text-night sm:mt-1.5 sm:rounded-lg sm:px-1.5 sm:py-1 sm:text-[10px]">
                  <span className="sm:hidden">☽ {leftovers[0].endTime}</span>
                  <span className="hidden sm:inline">
                    Overnight from {leftovers[0].startTime} · ends {leftovers[0].endTime}
                  </span>
                </div>
              )}

              <div className="relative z-10 mt-1 space-y-1 sm:mt-1.5">
                {dayShifts.map((shift) => (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => onSelectShift(shift)}
                    className={`flex w-full min-w-0 items-center justify-center gap-1 rounded-md px-1 py-0.5 text-[10px] leading-tight sm:justify-between sm:rounded-lg sm:px-1.5 sm:py-1 sm:text-[11px] ${chipClass(shift)}`}
                  >
                    <span className="truncate sm:hidden">
                      {shift.calledInSick ? "S" : shift.type === "night" ? "N" : shift.type === "evening" ? "E" : "D"}
                    </span>
                    <span className="hidden truncate sm:inline">
                      {shift.calledInSick
                        ? `Sick ${SHIFT_TYPES[shift.type].label}`
                        : `${shift.type === "night" ? "☽ " : ""}${SHIFT_TYPES[shift.type].label} ${shift.startTime}`}
                    </span>
                    {shift.unit && (
                      <span className="hidden truncate opacity-80 sm:inline">{shift.unit}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
