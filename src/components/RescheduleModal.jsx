"use client";

import { useState } from "react";
import { formatLongDate } from "@/lib/dates";
import ShiftBadge from "@/components/ShiftBadge";

export default function RescheduleModal({ shift, onClose, onSaved }) {
  const [newDate, setNewDate] = useState("");
  const [swappedWith, setSwappedWith] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/shifts/${shift.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate, swappedWith, note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not reschedule.");
      onSaved(data.shift);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-3">
      <button className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[min(92dvh,760px)] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-cream p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[1.75rem] sm:p-7"
      >
        <p className="text-xs uppercase tracking-[0.22em] text-night">Coworker swap</p>
        <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-xl sm:text-2xl">Reschedule this shift</h2>
        <p className="mt-2 text-sm text-moss">
          The original date stays on the shift so you can see what changed.
        </p>

        <div className="mt-5 rounded-2xl border border-line bg-paper px-4 py-3">
          <div className="flex items-center gap-2">
            <ShiftBadge type={shift.type} />
            <strong>{formatLongDate(shift.date)}</strong>
          </div>
          <p className="mt-1 text-sm text-moss">
            {shift.startTime}–{shift.endTime}
            {shift.unit ? ` · ${shift.unit}` : ""}
          </p>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm">New date</span>
          <input
            type="date"
            value={newDate}
            onChange={(event) => setNewDate(event.target.value)}
            required
            className="w-full rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none ring-gold/40 focus:ring-2"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1 block text-sm">Coworker you swapped with</span>
          <input
            value={swappedWith}
            onChange={(event) => setSwappedWith(event.target.value)}
            required
            minLength={2}
            placeholder="Alex Rivera"
            className="w-full rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none ring-gold/40 focus:ring-2"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1 block text-sm">Note (optional)</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Covering their Thursday, they take my Saturday…"
            className="w-full resize-none rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none ring-gold/40 focus:ring-2"
          />
        </label>

        {error && <p className="mt-3 rounded-2xl bg-evening/10 px-3 py-2 text-sm text-evening">{error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-2 sm:flex">
          <button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-night px-4 py-2.5 font-medium text-cream hover:bg-night-deep disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save swap"}
          </button>
          <button type="button" onClick={onClose} className="rounded-2xl border border-line px-4 py-2.5 text-moss">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
