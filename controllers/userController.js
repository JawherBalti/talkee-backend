'use strict';
const db = require('../models');
const sequelize = require('sequelize');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

/*  *********************************************************** */
//  create a user
/*  *********************************************************** */
exports.signup = async (req, res) => {
  const { firstName, familyName, email, password } = req.body;
  try {
    const user = await db.User.findOne({
      where: { email: req.body.email },
    });

    if (user) {
      return res.status(400).send({
        message: 'Email already used !',
      });
    } else {

      const allUsers = await db.User.findAll({
        attributes: {
          include: [[sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers']],
        },
      });
      const numUsers = allUsers[0].dataValues.totalUsers;
      let isAdmin = false;

      if (numUsers === 0) isAdmin = true;
      const hashPass = await bcrypt.hash(password, 10);
      const userObject = {
        firstName: firstName,
        familyName: familyName,
        email: email,
        password: hashPass,
        role: isAdmin,
        photoUrl: 'https://res.cloudinary.com/dv1lhvgjr/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1677681604/vxstqdsuya3bhwgtfspg.png',
        bannerUrl: 'https://res.cloudinary.com/dv1lhvgjr/image/upload/v1733000774/1728214017320_knbwju.jpg',
        biography: null,
        skills: null,
        isBlocked: false,
        isOnline: false,
      };
      const createdUser = await db.User.create(userObject);
      return res.status(200).send({
        message: 'User created successfully. You can now login !',
      });
    }
  } catch (error) {
    return res.status(400).send({
      message: 'An error occured while signing up !',
    });
  }
};
/*  ****************************************************** */
//  user login
/*  ****************************************************** */
exports.login = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { email: req.body.email } });

    if (!user) {
      return res.status(403).json({ message: 'Wrong email !' });
    } else {
      //compare passwords
      const hash = await bcrypt.compare(req.body.password, user.password);
      if (!hash) {
        return res.status(401).json({ message: 'Wrong email or password !' });
      } else {
        //create a token
        const token = jwt.sign({ userId: user.id }, process.env.COOKIE_KEY, {
          expiresIn: '24h',
        });

        if (req.cookies['snToken']) {
          req.cookies['snToken'] = '';
        }

        await user.update({ isOnline: true });

        res.cookie('snToken', token, {
          path: '/',
          maxAge: 1000 * 60 * 60 * 24, //24h
          httpOnly: true,
          sameSite: 'lax',
        });
        res.status(200).json({
          user: user,
        });
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'An error occured while logging in!' });
  }
};

/*  ****************************************************** */
//  logout
/*  ****************************************************** */

exports.logout = async (req, res) => {
  try {
    const cookies = req.headers.cookie;
    if (!cookies) {
      return res.status(404).json({ message: 'No token found!' });
    }

    const prevToken = cookies.split('=')[1];
    if (!prevToken) {
      return res.status(404).json({ message: 'No token found!' });
    }

    // Verify token and get user info
    jwt.verify(prevToken, process.env.COOKIE_KEY, async (err, decoded) => {
      if (err) {
        return res.status(400).json({ message: 'Invalid token!' });
      }
      try {
        // Update online status before clearing cookie
        await db.User.update(
          { isOnline: false },
          { where: { id: decoded.userId } }
        );

        res.clearCookie('snToken');
        return res.status(200).json({ message: 'Logged out successfully!' });
      } catch (updateErr) {
        return res.status(500).json({ message: 'Error updating online status' });
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'An error occurred while logging out!' });
  }
};

/*  ****************************************************** */
//  get all users
/*  ****************************************************** */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: [
        'id',
        'firstName',
        'familyName',
        'email',
        'photoUrl',
        'role',
        'isBlocked',
        'isOnline',
        'createdAt',
      ],
      include: [
        {
          model: db.User,
          as: 'followers',
          attributes: ['id', 'firstName', 'familyName', 'photoUrl'],
          through: {
            attributes: [],
          },
        },
        {
          model: db.User,
          as: 'following',
          attributes: ['id', 'firstName', 'familyName', 'photoUrl'],
          through: {
            attributes: [],
          },
        },
      ],
    });
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: 'An error occured !' });
  }
};

/*  ****************************************************** */
//  get one user
/*  ****************************************************** */
exports.getOneUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await db.User.findOne({
      where: { id },
      attributes: ['id', 'firstName', 'familyName', 'photoUrl', 'bannerUrl', 'role', 'isOnline']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get limited followers and following
    const [followers, following, followersCount, followingCount] = await Promise.all([
      user.getFollowers({
        attributes: ['id', 'firstName', 'familyName', 'photoUrl', 'isOnline'],
        limit: 4,
        order: [['createdAt', 'DESC']],
        joinTableAttributes: []
      }),
      user.getFollowing({
        attributes: ['id', 'firstName', 'familyName', 'photoUrl', 'isOnline'],
        limit: 4,
        order: [['createdAt', 'DESC']],
        joinTableAttributes: []
      }),
      user.countFollowers(),  // Get total followers count
      user.countFollowing()   // Get total following count
    ]);

    return res.status(200).json({ 
      user: {
        ...user.get({ plain: true }),
        followers,
        following,
        followersCount,  // Total count of followers
        followingCount   // Total count of following
      }
    });
  } catch (err) {
    console.error('Error in getOneUser:', err);
    return res.status(500).json({ error: 'An error occurred!' });
  }
};

/*  ****************************************************** */
// update user
/*  ****************************************************** */

// exports.updateUser = async (req, res) => {
//   const id = req.params.id;
//   const user = await db.User.findByPk(id);
//   const oldAvatar = user.photoUrl;
//   const oldBanner = user.banner;

//   let userObject = req.file
//     ? {
//         ...req.body,
//         photoUrl: req.file.filename,
//       }
//     : {
//         ...req.body,
//       };
//   try {
//     const user = await db.User.update(
//       {
//         ...userObject,
//         id: req.params.id,
//       },
//       {
//         where: {
//           id: req.params.id,
//         },
//       }
//     );

//     if (req.file && oldAvatar !== 'defaultAvatar.jpg') {
//       fs.unlinkSync(`images/${oldAvatar}`, (err) => {
//         if (err) throw err;
//       });
//     }

//     return res.status(200).json({
//       message: 'User updated successfully !',
//       user,
//     });
//   } catch (err) {
//     res.status(400).json({ message: 'Could not update user !' });
//   }
// };


exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await db.User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const { photoUrl, oldPhotoUrl, ...otherFields } = req.body;

    // If new avatar was provided and old avatar exists in Cloudinary
    if (photoUrl && oldPhotoUrl && oldPhotoUrl.includes('cloudinary')) {
      try {
        const urlParts = oldPhotoUrl.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        
        // Only delete if the new avatar is different
        if (photoUrl !== oldPhotoUrl) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryErr) {
        console.error('Error deleting old avatar:', cloudinaryErr);
      }
    }

    // Prepare update data
    const updateData = { ...otherFields };
    if (photoUrl) updateData.photoUrl = photoUrl;

    // Update user in database
    const [updatedRows] = await db.User.update(updateData, {
      where: { id },
    });

    if (updatedRows === 0) {
      return res.status(400).json({ message: 'No changes made!' });
    }

    // Get updated user data
    const updatedUser = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      message: 'User updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ message: 'Internal server error!' });
  }
};

// exports.updateBanner = async (req, res) => {
//   const id = req.params.id;
//   const user = await db.User.findByPk(id);
//   const oldBanner = user.bannerUrl;

//   let userObject = req.file
//     ? {
//         ...req.body,
//         bannerUrl: req.file.filename,
//       }
//     : {
//         ...req.body,
//       };
//   try {
//     const user = await db.User.update(
//       {
//         ...userObject,
//         id: req.params.id,
//       },
//       {
//         where: {
//           id: req.params.id,
//         },
//       }
//     );

//     if (req.file && oldBanner !== 'defaultBanner.jpg') {
//       fs.unlinkSync(`images/${oldBanner}`, (err) => {
//         if (err) throw err;
//       });
//     }
//     return res.status(200).json({
//       message: 'User updated successfully !',
//     });
//   } catch (err) {
//     res.status(400).json({ message: 'Could not update user !' });
//   }
// };


exports.updateBanner = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await db.User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const { bannerUrl, oldBannerUrl } = req.body;

    // If new banner was provided and old banner exists in Cloudinary
    if (bannerUrl && oldBannerUrl && oldBannerUrl.includes('cloudinary')) {
      try {
        const urlParts = oldBannerUrl.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        
        // Only delete if the new banner is different
        if (bannerUrl !== oldBannerUrl) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryErr) {
        console.error('Error deleting old banner:', cloudinaryErr);
      }
    }

    // Update user in database
    const [updatedRows] = await db.User.update(
      { bannerUrl },
      { where: { id } }
    );

    if (updatedRows === 0) {
      return res.status(400).json({ message: 'No changes made!' });
    }

    // Get updated user data
    const updatedUser = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      message: 'Banner updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating banner:', err);
    return res.status(500).json({ message: 'Internal server error!' });
  }
};

/*  ****************************************************** */
// change password
/*  ****************************************************** */
exports.updatePwd = async (req, res) => {
  const id = req.params.id;
  const hashedPwd = await bcrypt.hash(req.body.password, 10);
  const newUser = { password: hashedPwd };
  db.User.findByPk(id)
    .then((user) => {
      user
        .update(newUser, { where: { id: id } })
        .then((user = res.json(user)))
        .catch(() =>
          res.status(401).json({ message: 'Could not change password !' })
        );
    })
    .catch(() => res.status(400).json({ message: 'User not found !' }));
};

/*  ****************************************************** */
// delete user
/*  ****************************************************** */
exports.deleteUser = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);

    if (user.role == 0) {
      await user.destroy();
      return res.status(200).json({ message: 'User deleted !' });
    } else {
      return res.status(400).json({ message: 'Cannot delete the admin !' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'An error occured !' });
  }
};

exports.searchUser = async (req, res) => {
  try {
    let userInput = req.body.user.trim();
    let user = await db.User.findAll({
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn(
              'concat',
              sequelize.col('firstName'),
              ' ',
              sequelize.col('familyName')
            ),
            {
              [Op.like]: '%' + userInput + '%',
            }
          ),
          // { email: { $like: '%' + req.body.query + '%' } },
          // { companyName: { $like: '%' + req.body.query + '%' } }
        ],
      },
    });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'An error occured !' });
  }
};


exports.getFollowedUsers = async (req, res) => {
  const userId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const user = await db.User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get paginated results AND total count
    const [results, totalCount] = await Promise.all([
      user.getFollowing({
        attributes: ['id', 'firstName', 'familyName', 'photoUrl', 'isOnline'],
        joinTableAttributes: [],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      }),
      user.countFollowing() // Get total count of followed users
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      following: results,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });
  } catch (err) {
    console.error('Error in getFollowedUsers:', err);
    return res.status(500).json({ error: 'An error occurred' });
  }
};