import {
  createNotice as createNoticeService,
  getAllNotices as getAllNoticesService,
  getNoticeById as getNoticeByIdService,
  updateNotice as updateNoticeService,
  deleteNotice as deleteNoticeService
} from "./notice.service.js";

// Admin/Superadmin — create a new notice.
export const createNotice = async (req, res) => {
  try {
    const notice = await createNoticeService(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Notice created successfully",
      data: notice
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Any authenticated user — list notices with optional filters/pagination.
export const getAllNotices = async (req, res) => {
  try {
    const result = await getAllNoticesService(req.query);

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Any authenticated user — single notice by ID.
export const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await getNoticeByIdService(id);

    return res.status(200).json({
      success: true,
      data: notice
    });

  } catch (err) {
    if (err.message === "Notice not found") {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Admin/Superadmin — edit an existing notice.
export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await updateNoticeService(id, req.body, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Notice updated successfully",
      data: notice
    });

  } catch (err) {
    if (err.message === "Notice not found") {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Admin/Superadmin — delete a notice.
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteNoticeService(id);

    return res.status(200).json({
      success: true,
      message: "Notice deleted successfully"
    });

  } catch (err) {
    if (err.message === "Notice not found") {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
