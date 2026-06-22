import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../../models/user.model.js";
import { roleFactory } from "./user.factory.js";

export const createUserService = async (data) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const loginId = data.loginId;

    const isExisting = await User.findOne({ loginId }).session(session);

    if (isExisting) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [user] = await User.create(
      [
        {
          loginId,
          password: hashedPassword,
          role: data.role,
          isActive: true
        }
      ],
      { session }
    );

    await roleFactory(data.role, data, user, session);

    await session.commitTransaction();

    return {
      id: user._id,
      loginId: user.loginId,
      role: user.role
    };

  } catch (err) {
    await session.abortTransaction();
    throw new Error(err.message);

  } finally {
    await session.endSession();
  }
};