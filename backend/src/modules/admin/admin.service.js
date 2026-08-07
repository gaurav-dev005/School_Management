import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../../models/user.model.js";
import Admin from "./admin.model.js";

/**
 * Superadmin only: create a new admin account.
 * Creates the login (User, role="admin") and the admin profile
 * (name/phone/email) together in a single transaction.
 */
export const createAdmin = async (data, createdByUserId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const loginId = data.username;

    const isExisting = await User.findOne({ loginId }).session(session);

    if (isExisting) {
      throw new Error("Username already taken");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [user] = await User.create(
      [
        {
          loginId,
          password: hashedPassword,
          role: "admin",
          isActive: true
        }
      ],
      { session }
    );

    const [adminProfile] = await Admin.create(
      [
        {
          userId: user._id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          createdBy: createdByUserId,
          status: "Active"
        }
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      id: user._id,
      loginId: user.loginId,
      role: user.role,
      name: adminProfile.name,
      phone: adminProfile.phone,
      email: adminProfile.email
    };

  } catch (err) {
    await session.abortTransaction();
    throw new Error(err.message);

  } finally {
    await session.endSession();
  }
};
