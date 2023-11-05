// prescriptionModel.js
const express = require("express");
const { pool } = require("../db/db");

// Function to add a new prescription to the database
const addPrescription = async (prescriptionData) => {
  try {
    // Your SQL INSERT statement
    const insertQuery = `
      INSERT INTO prescriptions (
        user_id, us_address_id, international_address_id, prescription_file_url, prescriber_name, prescriber_institution, prescriber_phone, prescriber_email, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`;
    // Your SQL parameters
    const values = [
      prescriptionData.userId,
      prescriptionData.usAddressId, // The ID of the US address, or null if not applicable
      prescriptionData.internationalAddressId, // The ID of the international address, or null if not applicable
      prescriptionData.prescriptionUrl, // The URL of the prescription file stored in S3
      prescriptionData.prescriberName,
      prescriptionData.prescriberInstitution,
      prescriptionData.prescriberPhone,
      prescriptionData.prescriberEmail,
      prescriptionData.notes,
    ];
    // Execute the SQL query
    const res = await pool.query(insertQuery, values);
    return res.rows[0]; // Return the newly inserted prescription
  } catch (err) {
    throw err;
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
};
