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
    // console.log("Headers:", req.headers);
    // console.log("Body:", req.body);

    // Destructure the required fields from req.body
    const { amount, serviceId, user_id: userIdFromBody } = req.body;

    // Extract the userId from the JWT token
    const userIdFromToken = req.user.userId;

    // Compare the userId from token and the userId from request body
    if (userIdFromToken !== userIdFromBody) {
      console.log("Unauthorized action", userIdFromToken, userIdFromBody);
      return res.status(403).json({ error: "Unauthorized action" });
    }

    // Validate serviceId, amount, and user's eligibility for payment
    const idempotencyKey = uuidv4();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: { serviceId, userId: userIdFromToken },
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
