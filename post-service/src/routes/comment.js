const express = require("express");
const { authenticateRequest } = require("../middleware/auth-middleware");
const {
  createComment,
  getCommentsByPost,
} = require("../controllers/comment");

const router = express.Router();

router.use(authenticateRequest);
router.post("/comment", createComment);
router.get("/comment/:postId", getCommentsByPost);

module.exports = router;
