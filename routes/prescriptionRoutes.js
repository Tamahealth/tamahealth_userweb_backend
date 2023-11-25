const express = require("express");
const router = express.Router();
const prescriptionModel = require("../models/prescriptionModel");
const {
  upload,
  fileUploadMiddleware,
  deleteFileFromS3,
} = require("../utils/fileUploadHandler");
const { grabUserInfo } = require("../models/prescriptionModel");
const authenticateToken = require("../jwtMiddleware");

router.use(express.json());

// Route to submit a new prescription
router.post("/submit-prescription", authenticateToken, async (req, res) => {
  try {
    // Extract user ID from the authentication middleware
    const userId = req.user.userId;
    // console.log("User ID when submitting prescription is:", userId);

    // Split formData into relevant parts
    const { usAddressData, internationalAddressData, prescriptionData } =
      req.body;

    // Add additional details to prescriptionData
    prescriptionData.userId = userId;

    // Call the addPrescription function with split data
    const newPrescription = await prescriptionModel.addPrescription(
      userId,
      usAddressData,
      internationalAddressData,
      prescriptionData
    );

    // Clear formData from the client (send instruction in response)
    res.status(201).json({
      message: "Prescription submitted successfully",
      data: newPrescription,
      clearFormData: true,
    });
  } catch (error) {
    console.error("Error in submit-prescription route:", error);
    res.status(500).json({
      message: "Error submitting prescription",
      error: error.message,
    });
  }
});

// Route to fetch all prescriptions for the logged-in user
router.get("/my-prescriptions", async (req, res) => {
  try {
    const userId = req.user.id; // assuming the middleware adds user info to req.user
    const prescriptions = await prescriptionModel.getPrescriptionsByUserId(
      userId
    );
    res.status(200).json(prescriptions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching prescriptions", error: error.message });
  }
});

//grab current user info
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const userInfo = await grabUserInfo(userId);
    if (!userInfo) {
      return res.status(404).send("User not found");
    }
    res.json(userInfo);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

// File upload endpoint
router.post(
  "/upload-file",
  upload.single("file"),
  fileUploadMiddleware,
  (req, res) => {
    // if upload is successful, send back the file URL
    res.json({ fileUrl: req.fileUrl, fileKey: req.fileKey });
  }
);

// Endpoint to delete a file from S3
router.delete("/delete-file", async (req, res) => {
  // The fileKey should be the key of the file in the S3 bucket
  const { fileKey } = req.body;

  if (!fileKey) {
    return res.status(400).json({ message: "File key is required" });
  }

  const result = await deleteFileFromS3(fileKey);
  if (result.success) {
    res.json({ message: result.message });
  } else {
    res
      .status(500)
      .json({ message: "Error deleting file", error: result.error });
  }
});

module.exports = router;
