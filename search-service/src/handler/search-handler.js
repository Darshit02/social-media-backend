const { logger } = require("../utils/logger");
const Search = require("../models/search");
const handleSearchPost = async (event) => {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();
    logger.info("Search post event handled successfully", {
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });
    return {
      status: "success",
      message: "Search post event handled successfully",
      data: newSearchPost,
    };
  } catch (error) {
    logger.error("Error handling search post event: ", error);
    throw error;
  }
};

module.exports = { handleSearchPost };
