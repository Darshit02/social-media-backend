const { logger } = require("../utils/logger");
const { validateRegistration } = require("../utils/validation");
const User = require("../models/user");
const { generateToken } = require("../utils/token-generate");
const RefreshToken = require("../models/refresh-token");
const crypto = require("crypto");
const passwordResetTemplate = require("../template/email");
const sendEmail = require("../services/mail-service");

// user registration

const registerUser = async (req, res) => {
  logger.info("user registration request received");
  try {
    //validate user input
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error:", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    //check if user already exists
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      logger.warn("User already exists.please try to login");
      return res.status(400).json({
        success: false,
        message: "User already exists.please try to login",
      });
    } else {
      const newUser = new User({
        username,
        email,
        password,
      });
      await newUser.save();
      logger.info("User registered successfully");
      const { accessToken, refreshToken } = await generateToken(newUser);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: newUser,
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    }
  } catch (error) {
    logger.error("Error occurred during user registration:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// user login
const loginUser = async (req, res) => {
  logger.info("user login request received");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error:", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    //check if user already exists
    const { email, password } = req.body;
    const existingUser = await User.findOne({
      $or: [
        {
          email,
        },
      ],
    });
    if (!existingUser) {
      logger.warn("User not found.please register");
      return res.status(400).json({
        success: false,
        message: "User not found.please register",
      });
    }
    const isMatch = await existingUser.comparePassword(password);
    if (!isMatch) {
      logger.warn("Invalid credentials");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const { accessToken, refreshToken } = await generateToken(existingUser);
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: existingUser,
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error("Error occurred during user login:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// refresh token generation
const refreshToken = async (req, res) => {
  logger.info("user refresh token request received");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token is required");
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }
    //verify refresh token
    const decoded = await RefreshToken.findOne({
      token: refreshToken,
    });
    if (!decoded || decoded.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }
    //find user by id
    const user = await User.findById(decoded.user);
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    //delete old refresh token
    const oldRefreshToken = await RefreshToken.findByIdAndDelete({
      _id: decoded._id,
    });
    res.json({
      success: true,
      message: "Refresh token generated successfully",
      data: user,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error("Error occurred during refresh token generation:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// user logout

const logoutUser = async (req, res) => {
  logger.info("user logout request received");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token is required");
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }
    //verify refresh token
    await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    logger.info("Refresh token deleted successfully");
    res.json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    logger.error("Error occurred during user logout:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// password reset
const sendEmailForResetPassword = async (req, res) => {
  logger.info("Password reset request received");

  const { email } = req.body;

  if (!email) {
    logger.warn("Email is required");
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = user.passwordResetToken();
    await user.save();
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailContent = passwordResetTemplate(user.name, resetURL);
    // Send reset email
    await sendEmail(user.email, "Password Reset Request", emailContent);

    logger.info(`Password reset email sent to ${email}`);
    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    logger.error("Error sending password reset email:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const resetPasswordConfirm = async (req, res) => {
  logger.info("Password reset confirmation received");

  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    logger.warn("Reset token is required");
    return res.status(400).json({
      success: false,
      message: "Reset token is required",
    });
  }

  if (!password) {
    logger.warn("New password is required");
    return res.status(400).json({
      success: false,
      message: "New password is required",
    });
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn("Invalid or expired token");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    user.password = password;

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    logger.info(`Password reset successful for ${user.email}`);
    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    logger.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  sendEmailForResetPassword,
  resetPasswordConfirm,
};
