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
const router = require("./routes/auth-route");

const { RedisStore } = require("rate-limit-redis");
const { connectToDb } = require("./database/db");
const { logger } = require("./utils/logger");
const { configureCors } = require("./config/cors");

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

//IP based rate limiting
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

// apply rate limiting to all requests
app.use(`/api/auth/register`, sensitiveRatelimiter);

// API versioning middleware
app.use("/api/auth", router);

//error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
