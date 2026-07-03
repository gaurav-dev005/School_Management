import {
  createEnquiry as createEnquiryService,
  getAllEnquiries as getAllEnquiriesService,
  getEnquiriesByMonth as getEnquiriesByMonthService,
  getEnquiryById as getEnquiryByIdService,
  updateEnquiryStatus as updateEnquiryStatusService
} from "./enquiry.service.js";

// Public — anyone can submit an enquiry, no auth.
export const createEnquiry = async (req, res) => {
  try {
    const enquiry = await createEnquiryService(req.body);

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully. Our team will get in touch soon.",
      data: enquiry
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getAllEnquiries = async (req, res) => {
  try {
    const result = await getAllEnquiriesService(req.query);

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

export const getEnquiriesByMonth = async (req, res) => {
  try {
    const result = await getEnquiriesByMonthService(req.query);

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

export const getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await getEnquiryByIdService(id);

    return res.status(200).json({
      success: true,
      data: enquiry
    });

  } catch (err) {
    if (err.message === "Enquiry not found") {
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

export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await updateEnquiryStatusService(
      id,
      req.body,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: enquiry
    });

  } catch (err) {
    if (err.message === "Enquiry not found") {
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
