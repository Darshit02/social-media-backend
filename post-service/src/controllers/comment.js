const { logger } = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");
const Comment = require("../models/comment");

async function invalidatePostCache(req, input) {
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    logger.info("Invalidating post cache");
    await req.redisClient.del(keys);
  }
  logger.info("Post cache invalidated successfully");
  return {
    success: true,
    message: "Post cache invalidated successfully",
    data: input,
  };
}

const createComment = async (req, res) => {
  logger.info("Creating comment request received");
  try {
    const { postId, content, userId } = req.body;
    if (!postId || !content || !userId) {
      logger.error("Post ID, content, and user ID are required");
      return res.status(400).json({
        success: false,
        message: "Post ID, content, and user ID are required",
      });
    }
    const cacheKey = `posts:${postId}`;
    const cachedComments = await req.redisClient.get(cacheKey);
    if (cachedComments) {
      logger.info(`Returning cached comment for post ${postId}`);
      return res.json(JSON.parse(cachedComments));
    }
    // Assuming Comment is a Mongoose model for comments
    const newComment = new Comment({
      postId,
      user: userId,
      content,
    });
    await newComment.save();
    await req.redisClient.set(cacheKey, JSON.stringify(newComment), "EX", 3600);
    logger.info("Comment created successfully");
    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: newComment,
    });
    await invalidatePostCache(req, postId);
  } catch (error) {
    logger.error("Error creating comment: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports = {
  createComment
};