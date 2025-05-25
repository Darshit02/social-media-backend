const express = require("express");
const { authenticateRequest } = require("../middleware/auth-middleware");
const { createPost } = require("../controllers/post");

const router = express.Router();

// middelware -> this will be used to check if the user is authenticated
router.use(authenticateRequest);
router.post("/create-posts", createPost);


module.exports = router;