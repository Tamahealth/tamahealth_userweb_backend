const db = require("../db/db"); // Import your database connection

const PaymentModel = {
  async getServiceDetails(serviceId) {
    const query = `SELECT * FROM services WHERE service_id = $1`;
    const values = [serviceId];

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Method to create a new payment record
  async createPayment({
    userId,
    serviceId,
    amount,
    currency = "USD",
    stripePaymentId,
  }) {
    const query = `INSERT INTO payments (user_id, service_id, amount, currency, stripe_payment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const values = [userId, serviceId, amount, currency, stripePaymentId];

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Method to update payment status
  async updatePaymentStatus(paymentId, status, receiptUrl = null) {
    const query = `UPDATE payments SET payment_status = $1, receipt_url = $2 WHERE payment_id = $3 RETURNING *`;
    const values = [status, receiptUrl, paymentId];

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
};

module.exports = PaymentModel;
