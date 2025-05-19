const { logger } = require("../utils/logger");
const { validateRegistration } = require("../utils/validation");
const User = require("../models/user");
const { generateToken } = require("../utils/token-generate");

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

// refresh token generation

// user logout

// password reset



module.exports = {
    registerUser
}