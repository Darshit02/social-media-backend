require("dotenv").config();
const express = require("express");
const app = express();
const redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const ratelimiter = require("rate-limiter-flexible");
const PORT = process.env.PORT || 5000;
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/error-handler");

const mediaRoutes = require("./routes/media");

const { RedisStore } = require("rate-limit-redis");
const { connectToDb } = require("./database/db");
const { logger } = require("./utils/logger");
const { configureCors } = require("./config/cors");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./handler/media-handlers");

connectToDb();
const redisClient = new redis(process.env.REDIS_URL);
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(configureCors());
app.use((req, res, next) => {
  logger.info(`Request method: ${req.method}, Request URL: ${req.url}`);
  next();
});

const rateLimiter = new ratelimiter.RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Too many requests from IP: ${req.ip}`);
      res.status(429).json({
        status: false,
        message: "Too many requests, please try again later",
      });
    });
});

const sensitiveRatelimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Too many requests from IP: ${req.ip}`);
    res.status(429).json({
      status: false,
      message: "Too many requests, please try again later",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/media", sensitiveRatelimiter, mediaRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
    logger.info("RabbitMQ connection established successfully");
  } catch (error) {
    logger.error("Error RabbitMQ connection:", error);
  }
}

startServer();

//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
