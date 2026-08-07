import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },

    // Who this notice is meant for. Lets the frontend filter what a
    // given role/dashboard should display.
    targetAudience: {
      type: String,
      enum: ["All", "Students", "Teachers", "Admins"],
      default: "All"
    },

    // Optional file/image URLs attached to the notice (circulars, PDFs, etc).
    attachments: [
      {
        type: String,
        trim: true
      }
    ],

    isActive: {
      type: Boolean,
      default: true
    },

    publishDate: {
      type: Date,
      default: Date.now
    },

    // Optional — notice stops being relevant/shown after this date.
    expiryDate: Date,

    // Admin/superadmin who created the notice.
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Admin/superadmin who last edited the notice, if any.
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ targetAudience: 1 });
noticeSchema.index({ isActive: 1 });

export default mongoose.model("Notice", noticeSchema);
