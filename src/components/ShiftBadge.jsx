import { SHIFT_TYPES } from "@/lib/shifts";

const STYLES = {
  day: "bg-day/15 text-day",
  evening: "bg-evening/15 text-evening",
  night: "bg-night/15 text-night",
};

export default function ShiftBadge({ type, compact = false, calledInSick = false }) {
  const meta = SHIFT_TYPES[type] || SHIFT_TYPES.day;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        calledInSick
          ? "bg-sick text-white line-through decoration-2"
          : STYLES[type] || STYLES.day
      }`}
    >
      {type === "night" && !calledInSick && <span aria-hidden="true">☽</span>}
      {calledInSick ? "Sick" : compact ? meta.label[0] : meta.label}
    </span>
  );
}
