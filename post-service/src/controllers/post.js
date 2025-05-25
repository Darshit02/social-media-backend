const { logger } = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

const createPost = async (req, res) => {
  logger.info("Creating a new post request received");
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validation error:", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { mediaIds } = req.body;
    const newPost = new Post({
      user: req.user.userId || req.user._id,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();
    logger.info("Post created successfully");
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    logger.error("Error creating post: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllPosts = async (req, res) => {
  logger.info("Getting all posts request received");
  try {
  } catch (error) {
    logger.error("Error creating post: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getPostById = async (req, res) => {
  logger.info("Getting post by id request received");
  try {
  } catch (error) {
    logger.error("Error creating post: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deletePost = async (req, res) => {
  logger.info("Deleting post request received");
  try {
  } catch (error) {
    logger.error("Error creating post: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const likesOnPost = async (req, res) => {
  logger.info("Liking post request received");
  try {
  } catch (error) {
    logger.error("Error creating post: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  likesOnPost,
};
