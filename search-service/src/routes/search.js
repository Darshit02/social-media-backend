const express = require("express");
const router = express.Router();
const { searchPostController } = require("../controllers/search");
const { authenticateRequest } = require("../middleware/auth-middleware");


router.use(authenticateRequest)
router.get("/posts", searchPostController )


module.exports = router;