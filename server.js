//Imporing required modules
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const debug = require("debug");
const dotenv = require("dotenv");
dotenv.config();
const passport = require("passport");
const cookieSession = require("cookie-session");
const db = require("./db/db.js");
const PORT = process.env.PORT || 3001;
const bodyParser = require("body-parser");

// Creating an express application
const app = express();

// Enabling Cross-Origin Resource Sharing (CORS) with default configuration
const corsOptions = {
  // the first url to be changed with the deployed one later on
  origin: ["http://localhost:5173"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Setting up morgan to log HTTP requests in the 'dev' format
app.use(morgan("dev"));

// Enabling express to parse JSON bodies from HTTP requests
app.use(express.json());

// Enabling express to parse URL-encoded bodies from HTTP requests
// interpret the body data sent through requests (e.g. req.body) as JSON object
app.use(bodyParser.urlencoded({ extended: true }));

// Adding routes for authentication
const authRoutes = require("./routes/authRoutes");
// route for the authentication pages (authRoutes.js)
app.use("/api/auth", authRoutes);

//google @Meron-Abera what is this for? :)
app.use(
  cookieSession({
    name: "session",
    keys: ["cyberwolve"],
    maxAge: 24 * 60 * 60 * 100,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth/login", authRoutes);
//google end

// route for the otp pages (otpRoutes.js)
const otpRoutes = require("./routes/otpRoutes");
app.use("/api/auth/otp", otpRoutes);

// route for the prescription pages (prescriptionRoutes.js)
const prescriptionRoutes = require("./routes/prescriptionRoutes");
app.use("/api/prescriptions", prescriptionRoutes);

//route for the payment pages (paymentRoutes.js)
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

// erorr detail printing
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.toString() });
});

// Start listening on the defined port
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} 🚀`);
});
