const express = require("express");
const { authenticateRequest } = require("../middleware/auth-middleware");
const { likesOnPost, getLikesOnPost, unlikePost } = require("../controllers/likes");


const router = express.Router();


router.use(authenticateRequest);
router.put("/like", likesOnPost)
router.put("/unlike", unlikePost)
router.get("/get-like" , getLikesOnPost);

module.exports = router;