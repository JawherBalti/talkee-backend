'use strict';

const db = require('../models');

/*  *********************************************************** */
//  create a comment
/*  *********************************************************** */
exports.createComment = async (req, res) => {
  const message = req.body.message;

  try {
    if (message === '') {
      return res.status(400).json({ message: 'Please write a comment !' });
    }
    await db.Comment.create({
      message: message,
      UserId: req.userId,
      PostId: req.params.id,
    });
    res.status(200).json({ message: 'Comment added !' });
  } catch (err) {
    return res.status(400).json({ err: 'Could not add comment !' });
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
