import mongoose from "mongoose";

const SwapEventSchema = new mongoose.Schema(
  {
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    swappedWith: { type: String, required: true, trim: true },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ShiftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    type: {
      type: String,
      enum: ["day", "evening", "night"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    unit: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    calledInSick: { type: Boolean, default: false },
    originalDate: { type: String, default: null },
    swappedWith: { type: String, default: "", trim: true },
    swapHistory: { type: [SwapEventSchema], default: [] },
  },
  { timestamps: true },
);

ShiftSchema.index({ userId: 1, date: 1 });

export default mongoose.models.Shift || mongoose.model("Shift", ShiftSchema);
