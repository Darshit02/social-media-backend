require("dotenv").config();
const { logger } = require("../utils/logger");
const jwt = require("jsonwebtoken");

const validateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  logger.info(`Authorization header: ${authHeader}`);
  
  if (!token) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized: No token provided",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error(`Token verification error: ${err.message}`);
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Invalid token",
      });
    }
    
    req.user = user;
    next();
  });
};

module.exports = validateToken;
