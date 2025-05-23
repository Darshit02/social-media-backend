const express = require("express");
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  sendEmailForResetPassword,
  resetPasswordConfirm,
  verifyOtp,
} = require("../controllers/auth-controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/otp-verification", verifyOtp);

router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);
router.post("/send-mail", sendEmailForResetPassword);
router.post("/reset-password/:token", resetPasswordConfirm);

module.exports = router;
