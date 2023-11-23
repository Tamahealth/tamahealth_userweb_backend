const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require("uuid");
const authenticateToken = require("../jwtMiddleware");
const PaymentModel = require("../models/paymentModel");

// get the service ID from services table
router.get("/services/:serviceId", async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const serviceDetails = await PaymentModel.getServiceDetails(serviceId);
    res.json(serviceDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to create a payment intent
router.post("/create-payment-intent", authenticateToken, async (req, res) => {
  try {
    const { amount, serviceId, userId } = req.body;
    console.log("Request body is ", req.body);
    const user_id = req.user.userId; // Extracted from JWT token
    console.log(
      "userId from token is ",
      userId,
      "and user id from body is",
      user_id
    );
    if (userId !== user_id) {
      return res.status(403).json({ error: "Unauthorized action" });
    }
    // Validate serviceId, amount, and user's eligibility for payment
    const idempotencyKey = uuidv4();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: { serviceId, userId: userId },
      },
      { idempotencyKey }
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.log("Error creating payment intent: ", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to verify payment status
router.post("/verify-payment", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const user = req.user;

    // Fetch paymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify paymentIntent status and update the Payments table

    res.json({ success: true, status: paymentIntent.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error verifying payment: ", error.message);
  }
});

module.exports = router;
