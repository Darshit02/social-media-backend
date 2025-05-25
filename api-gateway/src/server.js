require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const app = express();
const PORT = process.env.PORT || 3000;
const proxy = require("express-http-proxy");
const errorHandler = require("./middleware/error-handler");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { logger } = require("./utils/logger");
const validateToken = require("./middleware/auth-middleware");

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(ratelimitOptions);

app.use((req, res, next) => {
  logger.info(`Request method: ${req.method}, Request URL: ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};

// Proxying requests to the Identity Service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

// Proxying requests to the Identity Service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId || srcReq.user._id;
      logger.info(
        `Forwarding request to Post service with user ID: ${srcReq.user.userId || srcReq.user._id}`
      );

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Post service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(
    `Proxying requests to Identity Service at ${process.env.IDENTITY_SERVICE_URL}`
  );
  logger.info(`Redis connection established at ${process.env.REDIS_URL}`);
  logger.info(`Rate limiting is enabled`);
});
