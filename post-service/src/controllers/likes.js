const { logger } = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");
const Like = require("../models/likes");

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

const likesOnPost = async (req, res) => {
  logger.info("Liking post request received");

  try {
    const { postId } = req.body;
    if (!postId) {
      logger.error("Post ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Post ID is required" });
    }

    const likes = await Like.findByIdAndUpdate(
      postId,
      { $inc: { numberOfLikes: 1 } },
      { new: true, upsert: true }
    );

    if (!likes) {
      logger.error("Post not found");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const cacheKey = `post:likes:${postId}`;
    await req.redisClient.set(
      cacheKey,
      JSON.stringify({ postId, likes: likes.numberOfLikes }),
      "EX",
      3600
    );

    logger.info("Post liked successfully");
    res.status(200).json({
      success: true,
      message: "Post liked successfully",
      likes: likes.numberOfLikes,
    });

    await invalidatePostCache(req, postId);
  } catch (error) {
    logger.error("Error liking post: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const unlikePost = async (req, res) => {
  logger.info("Unliking post request received");

  try {
    const { postId } = req.body;
    if (!postId) {
      logger.error("Post ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Post ID is required" });
    }

    const likes = await Like.findByIdAndUpdate(
      postId,
      { $inc: { numberOfLikes: -1 } },
      { new: true }
    );

    if (!likes) {
      logger.error("Post not found for unliking");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const cacheKey = `post:likes:${postId}`;
    await req.redisClient.set(
      cacheKey,
      JSON.stringify({ postId, likes: likes.numberOfLikes }),
      "EX",
      3600
    );

    logger.info("Post unliked successfully");
    res.status(200).json({
      success: true,
      message: "Post unliked successfully",
      likes: likes.numberOfLikes,
    });

    await invalidatePostCache(req, postId);
  } catch (error) {
    logger.error("Error unliking post: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getLikesOnPost = async (req, res) => {
  logger.info("Getting likes for post request received");

  try {
    const { postId } = req.body;
    if (!postId) {
      logger.error("Post ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Post ID is required" });
    }

    const cacheKey = `post:likes:${postId}`;
    const cachedLikes = await req.redisClient.get(cacheKey);
    if (cachedLikes) {
      logger.info(`Returning cached likes for post ${postId}`);
      return res.status(200).json({
        success: true,
        message: "Likes fetched successfully",
        result: JSON.parse(cachedLikes),
      });
    }

    const getLikes = await Like.findById(postId);
    if (!getLikes) {
      logger.error(`Likes data not found for post ${postId}`);
      return res
        .status(404)
        .json({ success: false, message: "Likes data not found" });
    }

    const result = { postId, likes: getLikes.numberOfLikes };
    await req.redisClient.set(cacheKey, JSON.stringify(result), "EX", 3600);

    logger.info(`Likes data fetched successfully for post ${postId}`);
    res
      .status(200)
      .json({ success: true, message: "Likes fetched successfully", result });
  } catch (error) {
    logger.error(`Error fetching likes for post: ${error.message}`, error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  likesOnPost,
  getLikesOnPost,
  unlikePost,
};
