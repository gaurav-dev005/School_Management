import { createAdmin as createAdminService } from "./admin.service.js";

// Superadmin only — create a new admin (name, phone, username, password).
export const createAdmin = async (req, res) => {
  try {
    const result = await createAdminService(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: result
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
