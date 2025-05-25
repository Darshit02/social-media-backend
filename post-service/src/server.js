require("dotenv").config();
const express = require("express");
const app = express();
const redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post");
const errorHandler = require("./middleware/error-handler");
const ratelimiter = require("rate-limiter-flexible");
const rateLimit = require("express-rate-limit");
const PORT = process.env.PORT || 5000;
const { RedisStore } = require("rate-limit-redis");
const { logger } = require("./utils/logger");
const { connectToDatabase } = require("./database/db");
const { configureCors } = require("./config/cors");

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
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
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

//routes pass redis client to the routes
app.use(
  "/api/posts",
  sensitiveRatelimiter,
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use((req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
