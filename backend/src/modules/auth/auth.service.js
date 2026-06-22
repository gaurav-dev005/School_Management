import User from "../../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "./auth.utils.js";

export const loginUser = async (loginId, password) => {

    const user = await User.findOne({ loginId });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id,
            role: user.role,
            loginId: user.loginId
        }
    };
};