import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import User from "./src/models/user.model.js";

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ loginId: "superadmin" });

    if (existing) {
      console.log("Superadmin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("superadmin123", 10);

    await User.create({
      loginId: "superadmin",
      password: hashedPassword,
      role: "superadmin",
      isActive: true
    });

    console.log("Superadmin created successfully ✅");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createSuperAdmin();