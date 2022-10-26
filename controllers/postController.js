'use strict';

const db = require('../models');
const fs = require('fs');

/*  *********************************************************** */
//  create a post
/*  *********************************************************** */
exports.createPost = async (req, res) => {
  let postObject = req.file
    ? {
        ...req.body,
        attachmentUrl: req.file.filename,
      }
    : {
        ...req.body,
      };
  try {
    const post = await db.Post.create({ ...postObject, UserId: req.userId });

    return res.status(201).json({
      message: 'Post created successfully!',
    });
  } catch (err) {
    return res.status(400).json({ message: 'Could not create post!' });
  }
};

/*  ****************************************************** */
//  get all posts
/*  ****************************************************** */
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await db.Post.findAll({
      attributes: ['id', 'content', 'attachmentUrl', 'createdAt'],
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.User,
          attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
        },
        {
          model: db.Like,
          attributes: ['UserId'],
        },
        {
          model: db.Comment,
          attributes: ['message', 'id', 'UserId', 'createdAt'],
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: db.User,
              attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
            },
          ],
        },
      ],
    });
    res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({ err: 'An error occured!' });
  }
};

/*  ****************************************************** */
//  get the posts of followed accounts
/*  ****************************************************** */

exports.getFollowedPosts = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await db.User.findOne({
      where: { id },
      include: [
        {
          model: db.Post,
          include: [
            {
              model: db.User,
              attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
            },
            {
              model: db.Like,
              attributes: ['UserId'],
            },
            {
              model: db.Comment,
              attributes: ['message', 'id', 'UserId', 'createdAt'],
              order: [['createdAt', 'DESC']],
              include: [
                {
                  model: db.User,
                  attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
                },
              ],
            },
          ],
        },
        {
          model: db.User,
          as: 'following',
          attributes: ['id', 'firstName', 'familyName', 'photoUrl'],
          through: {
            attributes: [],
          },
          include: [
            {
              model: db.Post,
              include: [
                {
                  model: db.User,
                  attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
                },
                {
                  model: db.Like,
                  attributes: ['UserId'],
                },
                {
                  model: db.Comment,
                  attributes: ['message', 'id', 'UserId', 'createdAt'],
                  order: [['createdAt', 'DESC']],
                  include: [
                    {
                      model: db.User,
                      attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    const followedPosts = [];
    user.Posts.map((post) => {
      followedPosts.push(post);
    });
    user.following.map((follow) => {
      follow.dataValues.Posts.map((post) => followedPosts.push(post));
    });

    return res
      .status(200)
      .json(followedPosts.sort((a, b) => b.createdAt - a.createdAt));
  } catch (err) {
    return res.status(500).json({ err: 'An error occured!' });
  }
};

/*  ****************************************************** */
//  get one post
/*  ****************************************************** */
exports.getOnePost = async (req, res) => {
  try {
    const post = await db.Post.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.User,
          attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
        },
        {
          model: db.Like,
          attributes: ['UserId'],
        },
        {
          model: db.Comment,
          attributes: ['message', 'id', 'UserId', 'createdAt'],
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: db.User,
              attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
            },
          ],
        },
      ],
    });
    res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({ message: 'An error occured!' });
  }
};

/*  ****************************************************** */
//  get all posts of one user
/*  ****************************************************** */

exports.getUserPosts = async (req, res) => {
  try {
    const post = await db.Post.findAll({
      where: { userId: req.params.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.User,
          attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
          order: [['createdAt', 'DESC']],
        },
        {
          model: db.Like,
          attributes: ['UserId'],
        },
        {
          model: db.Comment,
          attributes: ['message', 'id', 'UserId', 'createdAt'],
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: db.User,
              attributes: ['firstName', 'familyName', 'id', 'photoUrl'],
            },
          ],
        },
      ],
    });
    res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({ message: 'An error occured!' });
  }
};

/*  ****************************************************** */
// update a post
/*  ****************************************************** */

exports.updatePost = async (req, res) => {
  //get old picture
  const id = req.params.id;
  const post = await db.Post.findByPk(id);
  const oldPicture = post.attachmentUrl;

  let postObject = req.file
    ? {
        content: req.body.content,
        attachmentUrl: req.file.filename,
      }
    : {
        content: req.body.content,
        attachmentUrl: req.body.attachmentUrl,
      };
  try {
    await db.Post.update(
      {
        ...postObject,
        id: req.params.id,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    if (!postObject.attachmentUrl && oldPicture) {
      fs.unlinkSync(`images/${oldPicture}`, (err) => {
        if (err) throw err;
      });
    }
    return res.status(200).json({ message: 'Post updated successfully !' });
  } catch (err) {
    res.status(400).json({ message: 'Could not update post !' });
  }
};

/********************************************************/
// delete post
/********************************************************/
exports.deletePost = async (req, res) => {
  try {
    const post = await db.Post.findByPk(req.params.id);
    if (!post) {
      console.log(2);
      res.status(401).json({ err: 'Could not find post !' });
    } else {
      if (post.attachmentUrl) {
        fs.unlinkSync(`images/${post.attachmentUrl}`, (err) => {
          if (err) throw err;
        });
      }
      await post.destroy();

      res
        .status(200)
        .json({ message: `Post ${req.params.id} deleted successfully` });
    }
  } catch (err) {
    res.status(400).json({ err: 'Could not find post !' });
  }
};
