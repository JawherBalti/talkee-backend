'use strict';

const express = require("express");
const router = express.Router();
const { checkUser } = require("../middlewares/authUser");
const { authPage } = require("../middlewares/authPage");
const likeControl = require("../controllers/likeController");

// like CRUD
router.post("/:id", checkUser, likeControl.createLike);
//router.get("/:postId", checkUser, likeControl.getAllLikes);

module.exports = router;