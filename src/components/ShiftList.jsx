"use client";

import { addDays, compareISO, formatShortDate, hoursBetween, spansOvernight, startOfWeek, todayISO } from "@/lib/dates";
import ShiftBadge from "@/components/ShiftBadge";

const FILTERS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
  { id: "nights", label: "Nights" },
  { id: "swapped", label: "Swaps" },
  { id: "sick", label: "Sick" },
];

function matchesFilter(shift, filter, today) {
  if (filter === "upcoming") return compareISO(shift.date, today) >= 0 && !shift.calledInSick;
  if (filter === "nights") return shift.type === "night";
  if (filter === "swapped") return Boolean(shift.originalDate);
  if (filter === "sick") return Boolean(shift.calledInSick);
  return true;
}

export default function ShiftList({ shifts, filter, onFilterChange, onSelectShift, onReschedule, onDelete }) {
  const today = todayISO();
  const visible = shifts
    .filter((shift) => matchesFilter(shift, filter, today))
    .sort((a, b) => compareISO(a.date, b.date) || a.startTime.localeCompare(b.startTime));

  const groups = [];
  for (const shift of visible) {
    const week = startOfWeek(shift.date);
    const last = groups[groups.length - 1];
    if (!last || last.week !== week) {
      groups.push({ week, shifts: [shift] });
    } else {
      last.shifts.push(shift);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-cream p-3 sm:rounded-[1.75rem] sm:p-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={`rounded-full px-3 py-2 text-sm ${
              filter === item.id ? "bg-pine text-cream" : "bg-paper text-moss"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-moss">
          Nothing in this list yet. Add a shift from the calendar or switch filters.
        </p>
      )}

      <div className="mt-6 space-y-8">
        {groups.map((group) => (
          <div key={group.week}>
            <h3 className="mb-3 font-[family-name:var(--font-fraunces)] text-lg text-pine">
              Week of {formatShortDate(group.week)}
            </h3>
            <div className="space-y-3">
              {group.shifts.map((shift) => {
                const overnight = spansOvernight(shift.startTime, shift.endTime, shift.type);
                return (
                  <article
                    key={shift.id}
                    className={`rounded-3xl border px-4 py-4 ${
                      shift.calledInSick
                        ? "border-sick/30 bg-sick/5"
                        : shift.type === "night"
                          ? "border-night/20 bg-[linear-gradient(90deg,#eceef8,#faf6ee_55%)]"
                          : "border-line bg-paper/70"
                    }`}
                  >
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <button type="button" onClick={() => onSelectShift(shift)} className="min-w-0 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <ShiftBadge type={shift.type} calledInSick={shift.calledInSick} />
                          <strong className={`text-base ${shift.calledInSick ? "text-sick line-through" : ""}`}>
                            {formatShortDate(shift.date)}
                          </strong>
                          {compareISO(shift.date, today) === 0 && (
                            <span className="text-xs font-semibold uppercase tracking-wide text-gold">Today</span>
                          )}
                        </div>
                        <p className={`mt-2 text-sm ${shift.calledInSick ? "text-sick line-through" : "text-moss"}`}>
                          {shift.startTime}–{shift.endTime}
                          {overnight && !shift.calledInSick
                            ? ` · on duty until ${formatShortDate(addDays(shift.date, 1))}`
                            : ""}
                          {shift.calledInSick
                            ? " · called in sick · 0h"
                            : ` · ${hoursBetween(shift.startTime, shift.endTime)}h`}
                          {shift.unit ? ` · ${shift.unit}` : ""}
                        </p>
                        {shift.notes && <p className="mt-1 text-sm text-ink/70">{shift.notes}</p>}
                      </button>
                      <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectShift(shift)}
                          className="rounded-xl border border-line px-3 py-2 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onReschedule(shift)}
                          className="rounded-xl border border-night/20 px-3 py-2 text-sm text-night"
                        >
                          Swap
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(shift)}
                          className="rounded-xl px-3 py-2 text-sm text-evening"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {shift.originalDate && (
                      <div className="mt-3 rounded-2xl bg-night/10 px-3 py-2 text-sm text-night">
                        Rescheduled · originally {formatShortDate(shift.originalDate)}
                        {shift.swappedWith ? ` · swapped with ${shift.swappedWith}` : ""}
                        {shift.swapHistory?.length > 1
                          ? ` · ${shift.swapHistory.length} swaps on record`
                          : ""}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
