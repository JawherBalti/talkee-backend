'use strict';

const express = require('express');
const router = express.Router();
const postControl = require('../controllers/postController');
const { checkUser, refreshToken } = require('../middlewares/authUser');

const multer = require('../middlewares/multer-config');

// post CRUD
router.post('/', checkUser, postControl.createPost);
router.get('/', checkUser, postControl.getAllPosts);
router.get('/followed/:id', checkUser, postControl.getFollowedPosts);
router.get('/refresh', refreshToken, checkUser, postControl.getAllPosts);
router.get('/:id', checkUser, postControl.getOnePost);
router.get('/posts/:id', checkUser, postControl.getUserPosts);
router.put('/:id', checkUser, postControl.updatePost);
router.delete('/:id', checkUser, postControl.deletePost);

module.exports = router;
