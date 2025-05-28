const { logger } = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");
const Post = require("../models/post");
const { publishEvent } = require("../utils/rabbitmq");

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
    const { mediaIds, content } = req.body;
    const newPost = new Post({
      user: req.user.userId || req.user._id,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();
    await publishEvent("post.created", {
      postId : newPost._id.toString(),
      userId: newPost.user.toString(),
      content: newPost.content,
      createdAt: newPost.createdAt,
    })

    

    await invalidatePostCache(req, newPost._id.toString());
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      logger.info("Returning cached posts");
      return res.json(JSON.parse(cachedPosts));
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate({ path: 'likes', populate: { path: 'username' } })
      .populate({ path: 'comments', populate: { path: 'username' } });

    const total = await Post.countDocuments();
    const result = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      posts,
    };

     
    await req.redisClient.set(cacheKey, JSON.stringify(result), "EX", 300);
    logger.info("Posts fetched from database");
    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: result,
    });
    logger.info("Posts fetched successfully");
  } catch (error) {
    logger.error("Error fetching posts: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getPostById = async (req, res) => {
  logger.info("Getting post by id request received");
  try {
    const postId = req.params.id;
    const cacheKey = `posts:${postId}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      logger.info("Returning cached posts");
      return res.json(JSON.parse(cachedPosts));
    }
    if (!postId) {
      logger.error("Post ID is required");
      return res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
    }
    const post = await Post.findById(postId)
     .populate({ path: 'likes', populate: { path: 'username' } })
      .populate({ path: 'comments', populate: { path: 'username' } });

    if (!post) {
      logger.warn("Post was not found");
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    logger.info("Post fetched successfully");
    res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      post,
    });
    await invalidatePostCache(req, post._id.toString());
  } catch (error) {
    logger.error("Error fetching post: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    //publish post delete method ->
    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostCache(req, req.params.id);
    res.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting post", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};


module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
};
