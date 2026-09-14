"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MonthCalendar from "@/components/MonthCalendar";
import RescheduleModal from "@/components/RescheduleModal";
import ShiftList from "@/components/ShiftList";
import ShiftModal from "@/components/ShiftModal";
import { formatMonthTitle, hoursBetween, toISODate, todayISO } from "@/lib/dates";

export default function ScheduleApp() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view, setView] = useState("calendar");
  const [filter, setFilter] = useState("upcoming");
  const [user, setUser] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [reschedule, setReschedule] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const range = useMemo(() => {
    const from = toISODate(new Date(year, month - 2, 1));
    const to = toISODate(new Date(year, month + 1, 0));
    return { from, to };
  }, [year, month]);

  async function loadShifts() {
    setError("");
    const response = await fetch(`/api/shifts?from=${range.from}&to=${range.to}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load shifts.");
    setShifts(data.shifts);
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      try {
        const meResponse = await fetch("/api/auth/me");
        const meData = await meResponse.json();
        if (!meResponse.ok) throw new Error(meData.error || "Please sign in again.");
        if (!cancelled) setUser(meData.user);

        const shiftResponse = await fetch(`/api/shifts?from=${range.from}&to=${range.to}`);
        const shiftData = await shiftResponse.json();
        if (!shiftResponse.ok) throw new Error(shiftData.error || "Could not load shifts.");
        if (!cancelled) setShifts(shiftData.shifts);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  const stats = useMemo(() => {
    const inMonth = shifts.filter((shift) => shift.date.startsWith(monthKey));
    const nights = inMonth.filter((shift) => shift.type === "night").length;
    const swaps = inMonth.filter((shift) => shift.originalDate).length;
    const hours = inMonth.reduce((total, shift) => {
      if (shift.calledInSick) return total;
      return total + hoursBetween(shift.startTime, shift.endTime);
    }, 0);
    const next = [...shifts]
      .filter((shift) => shift.date >= todayISO() && !shift.calledInSick)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0];
    return { count: inMonth.length, nights, swaps, hours, next };
  }, [shifts, monthKey]);

  function upsertShift(updated) {
    setShifts((current) => {
      const without = current.filter((shift) => shift.id !== updated.id);
      return [...without, updated].sort((a, b) => a.date.localeCompare(b.date));
    });
    setEditor(null);
    setReschedule(null);
  }

  function goMonth(step) {
    const date = new Date(year, month - 1 + step, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const response = await fetch(`/api/shifts/${pendingDelete.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not delete the shift.");
      return;
    }
    setShifts((current) => current.filter((shift) => shift.id !== pendingDelete.id));
    setPendingDelete(null);
    setEditor(null);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-moss">NurseShift</p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-ink sm:text-4xl">Your schedule</h1>
          <p className="mt-1 truncate text-sm text-moss sm:text-base">
            {user ? `Signed in as ${user.username}` : "Loading your schedule…"}
            {user?.email ? <span className="hidden sm:inline"> · {user.email}</span> : null}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex flex-1 rounded-2xl border border-line bg-cream p-1 sm:flex-none">
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm sm:flex-none ${view === "calendar" ? "bg-pine text-cream" : "text-moss"}`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm sm:flex-none ${view === "list" ? "bg-pine text-cream" : "text-moss"}`}
            >
              List
            </button>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-2xl border border-line bg-cream px-4 py-2 text-sm text-moss"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-4">
        <Stat label="Shifts this month" value={stats.count} />
        <Stat label="Night shifts" value={stats.nights} />
        <Stat label="Hours booked" value={`${stats.hours}`} />
        <Stat label="Swaps recorded" value={stats.swaps} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => goMonth(-1)} className="rounded-xl border border-line bg-cream px-3 py-2" aria-label="Previous month">
            ‹
          </button>
          <h2 className="min-w-0 flex-1 text-center font-[family-name:var(--font-fraunces)] text-xl sm:min-w-48 sm:flex-none sm:text-2xl">
            {formatMonthTitle(year, month)}
          </h2>
          <button type="button" onClick={() => goMonth(1)} className="rounded-xl border border-line bg-cream px-3 py-2" aria-label="Next month">
            ›
          </button>
          <button
            type="button"
            onClick={() => {
              const current = new Date();
              setYear(current.getFullYear());
              setMonth(current.getMonth() + 1);
            }}
            className="rounded-xl px-3 py-2 text-sm text-moss"
          >
            Today
          </button>
        </div>
        {stats.next && (
          <p className="truncate text-sm text-moss">
            Next up: {stats.next.date} · {stats.next.type} {stats.next.startTime}–{stats.next.endTime}
          </p>
        )}
      </div>

      {error && <p className="mt-4 rounded-2xl bg-evening/10 px-4 py-3 text-sm text-evening">{error}</p>}

      <div className="mt-5">
        {loading ? (
          <p className="rounded-[1.75rem] border border-line bg-cream px-4 py-16 text-center text-moss">
            Loading your schedule…
          </p>
        ) : view === "calendar" ? (
          <MonthCalendar
            year={year}
            month={month}
            shifts={shifts}
            onSelectDay={(date) => setEditor({ date })}
            onSelectShift={(shift) => setEditor({ shift })}
          />
        ) : (
          <ShiftList
            shifts={shifts}
            filter={filter}
            onFilterChange={setFilter}
            onSelectShift={(shift) => setEditor({ shift })}
            onReschedule={setReschedule}
            onDelete={setPendingDelete}
          />
        )}
      </div>

      {view === "calendar" && (
        <p className="mt-4 text-sm text-moss">
          <span className="sm:hidden">Tap a day to add a shift, or a letter chip to edit it.</span>
          <span className="hidden sm:inline">
            Click a day to add a shift, or a shift chip to edit it. Night shifts stay on the start date and also mark the next morning.
          </span>
        </p>
      )}

      {editor && (
        <ShiftModal
          date={editor.date}
          shift={editor.shift}
          onClose={() => setEditor(null)}
          onSaved={upsertShift}
          onAskReschedule={(shift) => {
            setEditor(null);
            setReschedule(shift);
          }}
          onAskDelete={setPendingDelete}
        />
      )}

      {reschedule && (
        <RescheduleModal
          shift={reschedule}
          onClose={() => setReschedule(null)}
          onSaved={async (shift) => {
            upsertShift(shift);
            try {
              await loadShifts();
            } catch (err) {
              setError(err.message);
            }
          }}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl border border-line bg-cream p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[1.75rem] sm:p-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl">Delete this shift?</h2>
            <p className="mt-2 text-moss">
              {pendingDelete.date} · {pendingDelete.type} {pendingDelete.startTime}–{pendingDelete.endTime}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-2xl bg-evening px-4 py-2.5 font-medium text-cream"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-2xl border border-line px-4 py-2.5"
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-cream px-3 py-3 sm:rounded-3xl sm:px-4 sm:py-4">
      <p className="text-[10px] uppercase tracking-[0.14em] text-moss sm:text-xs sm:tracking-[0.18em]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl sm:text-3xl">{value}</p>
    </div>
  );
}
