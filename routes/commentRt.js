'use strict';

const express = require('express');
const router = express.Router();
const { checkUser } = require('../middlewares/authUser');
const commentControl = require('../controllers/commentController');

router.post('/:id', checkUser, commentControl.createComment);
router.delete('/:commentId', checkUser, commentControl.deleteComment);

module.exports = router;
