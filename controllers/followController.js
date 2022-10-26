'use strict';

const db = require('../models');

// exports.followUser = async (req, res) => {
//   const user = await db.Follower.findOne({
//     //find a post liked by a user
//     where: { userId: req.userId, followedUserId: req.params.id },
//   });

//   if (user) {
//     await db.Follower.destroy({
//       where: { userId: req.userId, followedUserId: req.params.id },
//     });
//     res.status(200).json({ message: 'User Unfollowed !' });
//   } else {
//     await db.Follower.create({
//       userId: req.userId,
//       followedUserId: req.params.id,
//     });
//     res.status(200).json({ message: 'User Followed !' });
//   }
// };

exports.follow = async (req, res, next) => {
  const user = await db.User.findOne({
    //find a post liked by a user
    where: { id: req.userId },
  });
  const targetUserId = req.params.id;
  try {
    if (!targetUserId) throw { message: 'Missing parameters' };
    await user.addFollowing(targetUserId);
    return res.status(201).json({ message: 'User followed' });
  } catch (err) {
    next(err);
  }
};

exports.unFollow = async (req, res, next) => {
  const user = await db.User.findOne({
    //find a post liked by a user
    where: { id: req.userId },
  });
  const targetUserId = req.params.id;
  try {
    if (!targetUserId) throw { message: 'Missing parameters' };
    user.removeFollowing(targetUserId);
    return res.status(200).json({ message: 'User unfollowed' });
  } catch (err) {
    next(err);
  }
};
