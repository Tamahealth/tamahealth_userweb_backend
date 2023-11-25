// prescriptionModel.js
const express = require("express");
const { pool } = require("../db/db");

const grabUserInfo = async (userId) => {
  try {
    const query = `
      SELECT * FROM users
      WHERE user_id = $1;
    `;
    const res = await pool.query(query, [userId]);
    return res.rows[0];
  } catch (err) {
    console.error(err);
    throw new Error("Error fetching user information");
  }
};

// Function to add a new prescription to the database

const addPrescription = async (
  userId,
  usAddressData,
  internationalAddressData,
  prescriptionData
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // Start transaction

    let usAddressId = null,
      internationalAddressId = null;

    // Insert into US_Addresses if usAddressData is provided
    if (usAddressData && Object.keys(usAddressData).length > 0) {
      const usAddressInsertQuery = `
        INSERT INTO US_Addresses (user_id, address_line_1, city, state, zip, country)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING address_id;`;
      const usAddressValues = [
        userId,
        usAddressData.address_line_1,
        usAddressData.city,
        usAddressData.state,
        usAddressData.zip,
        "United States", // Assuming country is always 'United States' for US_Addresses
      ];
      const usAddressRes = await client.query(
        usAddressInsertQuery,
        usAddressValues
      );
      usAddressId = usAddressRes.rows[0].address_id;
    }

    // Insert into International_Addresses if internationalAddressData is provided
    if (
      internationalAddressData &&
      Object.keys(internationalAddressData).length > 0
    ) {
      const internationalAddressInsertQuery = `
        INSERT INTO International_Addresses (user_id, full_address, city, country, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING address_id;`;
      const internationalAddressValues = [
        userId,
        internationalAddressData.full_address,
        internationalAddressData.city,
        internationalAddressData.country,
        internationalAddressData.notes || null, // Notes can be optional
      ];
      const internationalAddressRes = await client.query(
        internationalAddressInsertQuery,
        internationalAddressValues
      );
      internationalAddressId = internationalAddressRes.rows[0].address_id;
    }

    // Insert into Prescriptions
    const prescriptionInsertQuery = `
      INSERT INTO Prescriptions (user_id, us_address_id, international_address_id, prescription_file_url, prescriber_name, prescriber_institution, prescriber_phone, prescriber_email, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`;
    const prescriptionValues = [
      userId,
      usAddressId,
      internationalAddressId,
      prescriptionData.prescription_file_url,
      prescriptionData.prescriber_name,
      prescriptionData.prescriber_institution,
      prescriptionData.prescriber_phone,
      prescriptionData.prescriber_email,
      prescriptionData.patient_notes || null, // Notes can be optional
    ];
    console.log("Prescription Values:", prescriptionValues);

    const prescriptionRes = await client.query(
      prescriptionInsertQuery,
      prescriptionValues
    );

    await client.query("COMMIT"); // Commit transaction
    return prescriptionRes.rows[0]; // Return the newly inserted prescription
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback transaction on error
    console.error("Transaction Error:", err);
    throw err;
  } finally {
    client.release(); // Release client back to pool
  }
};

// Function to get all prescriptions from the database
const getPrescriptions = async () => {
  try {
    // Your SQL SELECT statement
    const query = `
      SELECT p.*, 
             usa.address_line_1 AS us_address_line_1, 
             usa.address_line_2 AS us_address_line_2, 
             usa.city AS us_city, 
             usa.state AS us_state, 
             usa.zip AS us_zip, 
             inta.full_address AS international_full_address, 
             inta.city AS international_city, 
             inta.country AS international_country 
      FROM prescriptions p
      LEFT JOIN US_Addresses usa ON p.us_address_id = usa.address_id
      LEFT JOIN International_Addresses inta ON p.international_address_id = inta.address_id;`;
    const res = await pool.query(query);
    return res.rows; // Return all prescriptions with address details
  } catch (err) {
    throw err;
  }
};

module.exports = {
  addPrescription,
  getPrescriptions,
  grabUserInfo,
};
