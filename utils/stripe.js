const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// console.log("Stripe Object:", stripe);
const { v4: uuidv4 } = require("uuid");

module.exports = { stripe, uuidv4 };
