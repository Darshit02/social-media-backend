require("dotenv").config();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/refresh-token");

const generateToken = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // refresh token expire in 7 days
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: expiresAt,
  });

  return {
    accessToken,
    refreshToken,
  };
};

module.exports = {
  generateToken,
};
