export const SHIFT_TYPES = {
  day: {
    label: "Day",
    startTime: "07:00",
    endTime: "19:00",
    hint: "Typical 12-hour day",
  },
  evening: {
    label: "Evening",
    startTime: "15:00",
    endTime: "23:00",
    hint: "Afternoon into late evening",
  },
  night: {
    label: "Night",
    startTime: "19:00",
    endTime: "07:00",
    hint: "Crosses midnight onto the next day",
  },
};

export function defaultTimesFor(type) {
  const preset = SHIFT_TYPES[type] || SHIFT_TYPES.day;
  return { startTime: preset.startTime, endTime: preset.endTime };
}
