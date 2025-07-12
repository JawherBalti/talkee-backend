'use strict';

const db = require('../models');

/*  *********************************************************** */
//  create a comment
/*  *********************************************************** */
exports.createComment = async (req, res) => {
  const message = req.body.message;

  try {
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Please write a comment!' });
    }
    
    const newComment = await db.Comment.create({
      message: message,
      UserId: req.userId,
      PostId: req.params.id,
    });
    
    // Include the full comment data with user information
    const commentWithUser = await db.Comment.findByPk(newComment.id, {
      include: [{
        model: db.User,
        attributes: ['id', 'firstName', 'familyName', 'photoUrl']
      }]
    });

    res.status(201).json({
      message: 'Comment added!',
      comment: commentWithUser
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    return res.status(500).json({ error: 'Could not add comment!' });
  }
};

/*  ****************************************************** */
//  get post comments
/*  ****************************************************** */
exports.getPostComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const offset = (page - 1) * limit;

    // Always return only 2 comments per request
    const comments = await db.Comment.findAll({
      where: { PostId: postId },
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
      include: [
        {
          model: db.User,
          attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
        }
      ]
    });

    const totalComments = await db.Comment.count({
      where: { PostId: postId }
    });

    res.status(200).json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
      hasMore: page < Math.ceil(totalComments / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};
/*  ****************************************************** */
// delete a comment
/*  ****************************************************** */
exports.deleteComment = async (req, res) => {
  await db.Comment.destroy({ where: { id: req.params.commentId } });
  res
    .status(200)
    .json({ message: `Comment ${req.params.commentId} deleted successfully` });
};
