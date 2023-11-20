const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const { v4: uuidv4 } = require("uuid");

// POST endpoint to create a payment intent
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, serviceId, user_id } = req.body;
    const user = req.user; // Assuming user info is set by authMiddleware

    // Validate serviceId, amount, and user's eligibility for payment
    const idempotencyKey = uuidv4(); // for avoiding duplicate charges
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: { serviceId, userId: user_id },
      },
      {
        idempotencyKey: idempotencyKey, // Ensure idempotency
      }
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
