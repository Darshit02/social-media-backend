require("dotenv").config();
const mongoose = require("mongoose");
const { logger } = require("../utils/logger");

const connectToDb = async () => {
  logger.info("Connecting to MongoDB...");
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed", error);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = {
  connectToDb,
};
