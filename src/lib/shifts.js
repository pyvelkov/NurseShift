export const SHIFT_TYPES = {
  day: {
    label: "Day",
    startTime: "07:30",
    endTime: "19:30",
    hint: "Typical 12-hour day",
  },
  evening: {
    label: "Evening",
    startTime: "15:30",
    endTime: "23:00",
    hint: "Afternoon into late evening",
  },
  night: {
    label: "Night",
    startTime: "19:30",
    endTime: "07:30",
    hint: "Crosses midnight onto the next day",
  },
};

export function defaultTimesFor(type) {
  const preset = SHIFT_TYPES[type] || SHIFT_TYPES.day;
  return { startTime: preset.startTime, endTime: preset.endTime };
}
