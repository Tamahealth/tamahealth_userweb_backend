const express = require("express");
const router = express.Router();
const prescriptionModel = require("../models/prescriptionModel");
const { upload, fileUploadMiddleware } = require("../utils/fileUploadHandler");

// Route to submit a new prescription
router.post(
  "/submit-prescription",
  upload.single("prescription"),
  fileUploadMiddleware,
  async (req, res) => {
    try {
      // Add the user ID from the authentication middleware to the prescription data
      req.body.userId = req.user.id;
      // Add the file URL from the fileUploadMiddleware to the prescription data
      req.body.prescriptionUrl = req.fileUrl;

      // Now req.body contains the text fields along with the prescription URL
      const newPrescription = await prescriptionModel.addPrescription(req.body);

      res.status(201).json({
        message: "Prescription submitted successfully",
        data: newPrescription,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error submitting prescription",
        error: error.message,
      });
    }
  }
);

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

module.exports = router;
