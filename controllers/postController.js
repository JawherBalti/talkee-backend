'use strict';

const db = require('../models');
const fs = require('fs');

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (add this at the top of your controller file)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*  *********************************************************** */
//  create a post
/*  *********************************************************** */
exports.createPost = async (req, res) => {
  let postObject = req.body.attachmentUrl
    ? {
        content: req.body.content,
        attachmentUrl: req.body.attachmentUrl, // This is now the Cloudinary URL
      }
    : {
        content: req.body.content,
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
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 1; // 1 post per request
    const offset = (page - 1) * limit;

    // Get paginated posts
    const posts = await db.Post.findAll({
      attributes: ['id', 'content', 'attachmentUrl', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
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

    // Get total count for pagination
    const totalPosts = await db.Post.count();

    return res.status(200).json({
      posts: posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page < Math.ceil(totalPosts / limit)
    });
  } catch (err) {
    return res.status(500).json({ err: 'An error occurred!' });
  }
};

/*  ****************************************************** */
//  get the posts of followed accounts
/*  ****************************************************** */

exports.getFollowedPosts = async (req, res) => {
  const id = req.params.id;
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = 10; // 1 post per request
  // How many posts to skip in each page
  const offset = (page - 1) * limit;
  try {
    // First get all followed user IDs (including self)
    const user = await db.User.findOne({
      where: { id },
      include: [{
        model: db.User,
        as: 'following',
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    const followedUserIds = [
      user.id,
      ...user.following.map(follow => follow.id)
    ];

    // Then get paginated posts from all followed users
    const posts = await db.Post.findAll({
      where: {
        UserId: { [db.Sequelize.Op.in]: followedUserIds }
      },
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
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
    });

    // Get total count for pagination
    const totalPosts = await db.Post.count({
      where: {
        UserId: { [db.Sequelize.Op.in]: followedUserIds }
      }
    });

    return res.status(200).json({
      posts: posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page < Math.ceil(totalPosts / limit)
    });
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
  const userId = req.params.id;
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = 5; // 1 post per request
  const offset = (page - 1) * limit;
  try {
      // Get paginated posts
      const posts = await db.Post.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
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

    // Get total count for pagination
    const totalPosts = await db.Post.count({
      where: { userId }
    });

    return res.status(200).json({
      posts: posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page < Math.ceil(totalPosts / limit)
    });
  } catch (err) {
    return res.status(500).json({ message: 'An error occurred!' });
  }
};

/*  ****************************************************** */
// update a post
/*  ****************************************************** */

exports.updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await db.Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    const { content, attachmentUrl, oldAttachmentUrl } = req.body;

    // Validate at least one field is being updated
    if (!content && !attachmentUrl) {
      return res.status(400).json({ message: 'No changes provided!' });
    }

    // If new image was provided and old image exists in Cloudinary
    if (attachmentUrl && oldAttachmentUrl && oldAttachmentUrl.includes('cloudinary')) {
      try {
        // Extract public_id from the old Cloudinary URL
        const urlParts = oldAttachmentUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        
        // Only delete if the new image is different from the old one
        if (attachmentUrl !== oldAttachmentUrl) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryErr) {
        console.error('Error deleting old image from Cloudinary:', cloudinaryErr);
        // Continue with update even if old image deletion fails
      }
    }

    // Prepare update object
    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;

    // Update the post in database
    const [updatedRows] = await db.Post.update(updateData, {
      where: { id },
    });

    if (updatedRows === 0) {
      return res.status(404).json({ message: 'Post not found or no changes made!' });
    }

    // Get the updated post to return in response
    const updatedPost = await db.Post.findByPk(id);

    return res.status(200).json({ 
      message: 'Post updated successfully!',
      post: updatedPost 
    });
  } catch (err) {
    console.error('Error updating post:', err);
    return res.status(500).json({ message: 'Internal server error while updating post!' });
  }
};

/********************************************************/
// delete post
/********************************************************/
exports.deletePost = async (req, res) => {
  try {
    // First get the post to check if it has an image
    const post = await db.Post.findOne({ where: { id: req.params.id } });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // If post has an image, delete it from Cloudinary
    if (post.attachmentUrl) {
      // Extract public_id from the URL (the part after the last / and before the file extension)
      const publicId = post.attachmentUrl.split('/').pop().split('.')[0];
      
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryErr) {
        console.error('Error deleting image from Cloudinary:', cloudinaryErr);
        // You might choose to continue with post deletion even if image deletion fails
      }
    }

    // Delete the post from database
    await db.Post.destroy({ where: { id: req.params.id } });
    
    return res.status(200).json({
      message: 'Post deleted successfully!',
    });
  } catch (err) {
    return res.status(400).json({ message: 'Could not delete post!' });
  }
};
