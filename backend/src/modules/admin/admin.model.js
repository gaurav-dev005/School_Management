import mongoose from "mongoose";
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const adminSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    name: {
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
      lowercase: true
    },

    // Superadmin who created this admin account.
    createdBy: {
      type: ObjectId,
      ref: "User"
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Admin", adminSchema);
