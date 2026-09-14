"use client";

import { useEffect, useState } from "react";
import { formatLongDate } from "@/lib/dates";
import { SHIFT_TYPES, defaultTimesFor } from "@/lib/shifts";
import ShiftBadge from "@/components/ShiftBadge";

const EMPTY = {
  type: "day",
  startTime: "07:30",
  endTime: "19:30",
  unit: "",
  notes: "",
  calledInSick: false,
};

export default function ShiftModal({ date, shift, onClose, onSaved, onAskReschedule, onAskDelete }) {
  const isEdit = Boolean(shift);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (shift) {
      setForm({
        type: shift.type,
        startTime: shift.startTime,
        endTime: shift.endTime,
        unit: shift.unit || "",
        notes: shift.notes || "",
        calledInSick: Boolean(shift.calledInSick),
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [shift, date]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseType(type) {
    const times = defaultTimesFor(type);
    setForm((current) => ({ ...current, type, ...times }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch(isEdit ? `/api/shifts/${shift.id}` : "/api/shifts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: isEdit ? shift.date : date,
          ...form,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the shift.");
      onSaved(data.shift);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  const headingDate = isEdit ? shift.date : date;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-3">
      <button className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[min(92dvh,760px)] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-cream p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[1.75rem] sm:p-7"
      >
        <p className="text-xs uppercase tracking-[0.22em] text-moss">
          {isEdit ? "Edit shift" : "Add shift"}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-xl sm:text-2xl">
          {formatLongDate(headingDate)}
        </h2>

        {isEdit && shift.originalDate && (
          <p className="mt-3 rounded-2xl bg-night/10 px-3 py-2 text-sm text-night">
            Rescheduled from {formatLongDate(shift.originalDate)}
            {shift.swappedWith ? ` with ${shift.swappedWith}` : ""}.
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          {Object.entries(SHIFT_TYPES).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => chooseType(key)}
              className={`rounded-2xl border px-1.5 py-2.5 text-left transition sm:px-2 sm:py-3 ${
                form.type === key
                  ? "border-pine bg-pine text-cream"
                  : "border-line bg-paper text-ink hover:border-moss"
              }`}
            >
              <span className="block text-sm font-semibold">{meta.label}</span>
              <span className={`mt-1 hidden text-[11px] sm:block ${form.type === key ? "text-cream/70" : "text-moss"}`}>
                {meta.startTime}–{meta.endTime}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm">Start</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => update("startTime", event.target.value)}
              className="w-full rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none ring-gold/40 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">End</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => update("endTime", event.target.value)}
              className="w-full rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none ring-gold/40 focus:ring-2"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-sm">Unit or floor (optional)</span>
          <input
            value={form.unit}
            onChange={(event) => update("unit", event.target.value)}
            placeholder="ICU, ER, Med-Surg…"
            className="w-full rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none ring-gold/40 focus:ring-2"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1 block text-sm">Notes (optional)</span>
          <textarea
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            rows={3}
            className="w-full resize-none rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none ring-gold/40 focus:ring-2"
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
          <input
            type="checkbox"
            checked={form.calledInSick}
            onChange={(event) => update("calledInSick", event.target.checked)}
            className="mt-1 h-4 w-4 accent-sick"
          />
          <span>
            <span className="block text-sm font-medium">Called in sick</span>
            <span className="mt-0.5 block text-sm text-moss">
              The shift stays on the calendar, crossed out in red, and those hours are not counted.
            </span>
          </span>
        </label>

        {form.type === "night" && !form.calledInSick && (
          <p className="mt-3 flex items-start gap-2 text-sm text-night">
            <ShiftBadge type="night" />
            <span>This overnight shift will also show on the following morning.</span>
          </p>
        )}

        {error && <p className="mt-3 rounded-2xl bg-evening/10 px-3 py-2 text-sm text-evening">{error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="submit"
            disabled={pending}
            className="col-span-2 rounded-2xl bg-pine px-4 py-2.5 font-medium text-cream hover:bg-ink disabled:opacity-60 sm:col-span-1"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add shift"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line px-4 py-2.5 text-moss"
          >
            Cancel
          </button>
          {isEdit && (
            <>
              <button
                type="button"
                onClick={() => onAskReschedule(shift)}
                className="rounded-2xl border border-night/20 px-4 py-2.5 text-night"
              >
                Swap / reschedule
              </button>
              <button
                type="button"
                onClick={() => onAskDelete(shift)}
                className="rounded-2xl px-4 py-2.5 text-evening sm:ml-auto"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
