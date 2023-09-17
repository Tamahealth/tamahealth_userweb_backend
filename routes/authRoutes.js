// Router endpoints for handling [login, registration, google login, logout]
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { pool } = require("../db/db");
const { BYCRYPT_SALT_ROUNDS } = require("../db/db");

// genetaring a random user id
function generateUserId(length = 6) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let userId = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    userId += charset[randomIndex];
  }
  return userId;
}

async function getUniqueUserId() {
  let userId = generateUserId();
  let exists = await checkUserIdExists(userId);
  while (exists) {
    userId = generateUserId();
    exists = await checkUserIdExists(userId);
  }
  return userId;
}

async function checkUserIdExists(userId) {
  const checkQuery = `SELECT 1 FROM users WHERE user_id = $1 LIMIT 1;`;
  const result = await pool.query(checkQuery, [userId]);
  return result.rows.length > 0;
}

router.post("/googleauth", async (req, res) => {
  const { firstName, email } = req.body;

  try {
    // Query the database for a user with the provided email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length > 0) {
      // If the user exists, authenticate them and send a response
      const user = result.rows[0];
      const token = jwt.sign(
        {
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        "secret-key-unique",
        {
          expiresIn: "24h",
        }
      );

      res.json({
        message: "User authenticated successfully",
        token: token,
        userId: user.user_id,
      });
    } else {
      // If the user does not exist, send a response indicating that they need to register
      res.json({ message: "User not found, please register" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Register endpoint for handling user registration
router.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;
  try {
    // using bcrypt to hash the password before storing
    const salt = await bcrypt.genSalt(BYCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = await getUniqueUserId();

    // query for adding the user to the database
    const createUserQuery = `INSERT INTO users (
        user_id,
        email,
        password,
        first_name,
        last_name,
        phone_number
      )
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
    const values = [
      userId,
      email.toLowerCase(),
      hashedPassword,
      firstName,
      lastName,
      phoneNumber,
    ];
    const result = await pool.query(createUserQuery, values);
    const user = result.rows[0];

    // JWT (JSON Web Token) is used for authentication. The token includes the user details
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
      },
      "secret-key-unique",
      {
        expiresIn: "24h",
      }
    );

    // Returning a successful registration response along with the user data and token
    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
      token: token,
    });
    // Catch any errors during the registration process
  } catch (err) {
    console.log("Error registering user: " + err);
    console.log(err.stack);
    res.status(500).json({
      message: "Error registering user",
      error: err.stack,
    });
  }
});

// Login endpoint for handling user login using username/email and password
router.post("/login", async (req, res) => {
  const { loginIdentifier, password } = req.body;
  try {
    const isEmail = loginIdentifier.includes("@");
    const getUserQuery = isEmail
      ? `SELECT * FROM users WHERE email = $1`
      : `SELECT * FROM users WHERE phone_number = $1`;

    const result = await pool.query(getUserQuery, [loginIdentifier]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }
    // JWT (JSON Web Token) is used for authentication. The token includes the user details
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
      },
      "secret-key-unique",
      {
        expiresIn: "24h",
      }
    );
    // Returning a successful login response along with the user data and token
    res.status(200).json({
      token: token,
      user: {
        userId: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
      },
    });
  } catch (err) {
    console.log("Error logging in user: ", err);
    res.status(500).json({
      message: "Error logging in user",
      error: err.stack,
    });
  }
});

module.exports = router;
