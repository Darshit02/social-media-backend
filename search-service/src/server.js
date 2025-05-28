require("dotenv").config();
const express = require("express");
const app = express();
const redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/error-handler");
const ratelimiter = require("rate-limiter-flexible");
const rateLimit = require("express-rate-limit");
const PORT = process.env.PORT || 5000;
const { RedisStore } = require("rate-limit-redis");
const { logger } = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { connectToDatabase } = require("./database/db");
const { configureCors } = require("./config/cors");
const search = require("./routes/search");
const { handleSearchPost } = require("./handler/search-handler");

connectToDatabase();

const redisClient = new redis(process.env.REDIS_URL);

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(configureCors());
app.use((req, res, next) => {
  logger.info(`Request method: ${req.method}, Request URL: ${req.url}`);
  next();
});

app.use("/api/search", search);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.created", handleSearchPost);

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
    logger.info("RabbitMQ connection established successfully");
  } catch (error) {
    logger.error("Error RabbitMQ connection:", error);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
