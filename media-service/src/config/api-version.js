const { logger } = require("../utils/logger");

const apiVersion = (version = (req, res, next) => {
  if (req.path.startsWith(`/api/${version}`)) {
    next();
  } else {
    logger.warn(`version ${version} not accepted`);
    res.status(404).json({
      status: false,
      message: `API version ${version} not found`,
    });
  }
});

module.exports = {
  apiVersion,
};
