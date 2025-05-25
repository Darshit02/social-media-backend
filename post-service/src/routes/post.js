const express = require("express");
const { authenticateRequest } = require("../middleware/auth-middleware");
const { createPost, getAllPosts, getPostById, deletePost } = require("../controllers/post");

const router = express.Router();

// middelware -> this will be used to check if the user is authenticated
router.use(authenticateRequest);
router.post("/create-posts", createPost);
router.get("/get-posts", getAllPosts);
router.get("/get-single-post/:id", getPostById);
router.delete("/delete-post/:id", deletePost);



module.exports = router;
