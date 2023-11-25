const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET_KEY || "fallback-secret-key";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(403).json({ message: "Token verification failed" });
    }
    if (!user || !user.userId) {
      // Change this line to check for userId
      console.error("Invalid token payload:", user);
      return res.status(403).json({ message: "Invalid token payload" });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
