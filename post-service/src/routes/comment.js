const express = require("express");
const { authenticateRequest } = require("../middleware/auth-middleware");
const { createComment } = require("../controllers/comment");


const router = express.Router();

router.use(authenticateRequest);
router.post("/comment", createComment);

module.exports = router;
