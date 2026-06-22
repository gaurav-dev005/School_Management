import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    }
  },
  { timestamps: true }
);

sectionSchema.index({ name: 1, classId: 1 }, { unique: true });

export default mongoose.model("Section", sectionSchema);