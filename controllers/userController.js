'use strict';
const db = require('../models');
const sequelize = require('sequelize');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');

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
      if (req.file) fs.unlinkSync(req.file.path);
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
        photoUrl: req.file ? req.file.filename : 'defaultAvatar.jpg',
        bannerUrl: req.file ? req.file.filename : 'defaultBanner.jpg',
        biography: null,
        skills: null,
        isBlocked: false,
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
exports.logout = (req, res) => {
  const cookies = req.headers.cookie;
  const prevToken = cookies.split('=')[1];
  if (!prevToken) {
    res.status(404).json({ message: 'No Token Found !' });
  }
  jwt.verify(prevToken, process.env.COOKIE_KEY, (err, user) => {
    if (err) return res.status(400).json({ message: 'Invalid Token ! ' });
    res.clearCookie('snToken');
    return res.status(200).json({ message: 'Logged Out Successfully !' });
  });
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
      include: [
        {
          model: db.User,
          as: 'followers',
          attributes: ['id', 'firstName', 'familyName', 'photoUrl'],
          through: {
            attributes: [],
          },
          include: [{ model: db.Post, include: [{ model: db.User }] }],
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
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ err: 'An error occured!' });
  }
};

/*  ****************************************************** */
// update user
/*  ****************************************************** */

exports.updateUser = async (req, res) => {
  const id = req.params.id;
  const user = await db.User.findByPk(id);
  const oldAvatar = user.photoUrl;
  const oldBanner = user.banner;

  let userObject = req.file
    ? {
        ...req.body,
        photoUrl: req.file.filename,
      }
    : {
        ...req.body,
      };
  try {
    const user = await db.User.update(
      {
        ...userObject,
        id: req.params.id,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    if (req.file && oldAvatar !== 'defaultAvatar.jpg') {
      fs.unlinkSync(`images/${oldAvatar}`, (err) => {
        if (err) throw err;
      });
    }

    return res.status(200).json({
      message: 'User updated successfully !',
      user,
    });
  } catch (err) {
    res.status(400).json({ message: 'Could not update user !' });
  }
};

exports.updateBanner = async (req, res) => {
  const id = req.params.id;
  const user = await db.User.findByPk(id);
  const oldBanner = user.bannerUrl;

  let userObject = req.file
    ? {
        ...req.body,
        bannerUrl: req.file.filename,
      }
    : {
        ...req.body,
      };
  try {
    const user = await db.User.update(
      {
        ...userObject,
        id: req.params.id,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    if (req.file && oldBanner !== 'defaultBanner.jpg') {
      fs.unlinkSync(`images/${oldBanner}`, (err) => {
        if (err) throw err;
      });
    }
    return res.status(200).json({
      message: 'User updated successfully !',
    });
  } catch (err) {
    res.status(400).json({ message: 'Could not update user !' });
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
