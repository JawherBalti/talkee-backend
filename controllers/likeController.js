'use strict';

const db = require('../models');

/*  *********************************************************** */
//  like a post
/*  *********************************************************** */
exports.createLike = async (req, res) => {
  const user = await db.Like.findOne({
    //find a post liked by a user
    where: { UserId: req.userId, PostId: req.params.id },
  });

  if (user) {
    await db.Like.destroy({
      where: { UserId: req.userId, PostId: req.params.id },
    });
    res.status(200).json({ message: 'Post disliked' });
  } else {
    await db.Like.create({ UserId: req.userId, PostId: req.params.id });
    res.status(200).json({ message: 'Post liked' });
  }
};
