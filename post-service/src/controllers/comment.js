const { logger } = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");
const Comment = require("../models/comment");
const Post = require("../models/post"); 

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

    const post = await Post.findById(postId);
    if (!post) {
      logger.error(`Post with ID ${postId} not found`);
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }


    const newComment = new Comment({
      postId,
      user: userId,
      content,
    });

    const savedComment = await newComment.save();

    await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: savedComment._id } },
      { new: true }
    );

    const cacheKey = `comment:${savedComment._id}`;
    await req.redisClient.set(cacheKey, JSON.stringify(savedComment), "EX", 3600);

    logger.info("Comment created successfully");
    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: savedComment,
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

const getCommentsByPost = async (req, res) => {
  logger.info("Getting comments for post request received");
  try {
    const { postId } = req.params;
    
    if (!postId) {
      logger.error("Post ID is required");
      return res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
    }

    const cacheKey = `posts:${postId}:comments`;
    const cachedComments = await req.redisClient.get(cacheKey);
    
    if (cachedComments) {
      logger.info(`Returning cached comments for post ${postId}`);
      return res.json({
        success: true,
        data: JSON.parse(cachedComments),
      });
    }

    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 });

    await req.redisClient.set(cacheKey, JSON.stringify(comments), "EX", 3600);

    logger.info(`Found ${comments.length} comments for post ${postId}`);
    res.json({
      success: true,
      data: comments,
    });

  } catch (error) {
    logger.error("Error getting comments: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
};