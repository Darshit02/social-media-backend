const cors = require("cors");

function configureCors() {
  return cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3001", // local development
        "https://yourproductiondomain.com", // production
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-version"],
    exposedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    maxAge: 600,
    optionsSuccessStatus: 204,
  });
}

module.exports = { configureCors };
