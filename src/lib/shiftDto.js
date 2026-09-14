export function serializeShift(shift) {
  return {
    id: shift._id.toString(),
    date: shift.date,
    type: shift.type,
    startTime: shift.startTime,
    endTime: shift.endTime,
    unit: shift.unit || "",
    notes: shift.notes || "",
    calledInSick: Boolean(shift.calledInSick),
    originalDate: shift.originalDate,
    swappedWith: shift.swappedWith || "",
    swapHistory: shift.swapHistory || [],
    createdAt: shift.createdAt,
    updatedAt: shift.updatedAt,
  };
}
