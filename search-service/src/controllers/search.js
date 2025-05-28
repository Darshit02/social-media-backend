const Search = require("../models/search");
const { logger } = require("../utils/logger");

const searchPostController = async (req, res) => {
  logger.info("Search Post Controller: Start processing search request");
  try {
    const { query } = req.body;
    if (!query) {
      logger.warn("Search Post Controller: No query provided");
      return res.status(400).json({ error: "Query is required" });
    }

    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(10);

    logger.info("Search Post Controller: Search completed successfully");
    return res.status(200).json({
        success: true,
        message: "Search results retrieved successfully",
        results 
    });
  } catch (error) {
    logger.error(`Search Post Controller: Error occurred - ${error.message}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  searchPostController,
};
