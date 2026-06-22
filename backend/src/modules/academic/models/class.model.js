import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

classSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Class", classSchema);