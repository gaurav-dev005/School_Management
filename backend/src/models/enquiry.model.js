import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true
    },

    parentName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"]
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"]
    },

    classApplied: {
      type: String,
      trim: true
    },

    message: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    // How the enquiry reached the school — useful for admins tracking
    // which channels actually convert to admissions.
    source: {
      type: String,
      enum: ["Website", "Walk-in", "Phone", "Referral", "Other"],
      default: "Website"
    },

    status: {
      type: String,
      enum: ["Pending", "Contacted", "Admitted", "Not Interested", "Closed"],
      default: "Pending"
    },

    // Free-text notes an admin can add while following up (call notes, etc).
    remarks: {
      type: String,
      trim: true
    },

    followUpDate: Date,

    // Which staff member is handling this enquiry, if assigned.
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Admin dashboards mostly filter by status and sort/browse by date,
// so both are indexed. Phone is indexed to make duplicate-enquiry
// lookups (same family enquiring again) cheap.
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ phone: 1 });

export default mongoose.model("Enquiry", enquirySchema);
