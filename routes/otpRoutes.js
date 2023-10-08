const express = require("express");
const router = express.Router();
const twilio = require("twilio");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "my-secret-key";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;
const client = twilio(accountSid, authToken); // Initialize the Twilio client
// console.log("Account SID:", accountSid);
// Generate OTP and send via SMS
router.post("/send-otp", async (req, res) => {
  try {
    // console.log("Account SID:", accountSid);
    // console.log("Auth Token:", authToken);
    // console.log("Service ID:", serviceId);
    console.log("request body:", req.body);

    const { phoneNumber } = req.body;
    const fullPhoneNumber = `+1${phoneNumber}`;
    const verification = await client.verify.v2
      .services(serviceId)
      .verifications.create({
        to: `+${fullPhoneNumber}`,
        channel: "sms",
      });
    console.log(`Sending OTP to +${fullPhoneNumber}`);
    console.log("Twilio Response:", verification);

    if (verification.status === "pending") {
      res
        .status(200)
        .send({ success: true, message: "OTP sent successfully." });
    } else {
      res.status(400).send({
        success: false,
        message: "Could not send OTP.",
        error: verification,
      });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).send({
      success: false,
      message: "An error occurred while sending OTP.",
      error: error.message,
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    console.log("Received:", { phoneNumber, code });
    const fullPhoneNumber = `+1${phoneNumber}`;

    const verificationCheck = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({
        to: fullPhoneNumber,
        code,
      });

    console.log("Verification Check:", verificationCheck);

    if (verificationCheck.status === "approved") {
      res.status(200).send({ message: "OTP verified successfully." });
    } else {
      res.status(400).send({ message: "Invalid OTP." });
    }
  } catch (error) {
    console.error("Error in OTP Verification:", error);
    res.status(500).send(error);
  }
});

module.exports = router;
