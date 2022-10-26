const db = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

exports.createConversation = async (req, res, next) => {
  const userId = req.userId;
  const otherUserId = parseInt(req.params.id);

  try {
    const conversation = await db.Conversation.create({
      firstUserId: userId,
      secondUserId: otherUserId,
      firstUser: req.body.firstUser,
      secondUser: req.body.secondUser,
      message: req.body.message,
      unreadMessageSecondUser: req.body.unreadMessageSecondUser,
      senderId: userId,
    });
    return res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
};

exports.getOneConversation = async (req, res, next) => {
  const userId = req.userId;
  const otherUserId = req.params.id;
  const convId = userId.toString() + otherUserId.toString();
  try {
    const conversations = await db.Conversation.findAll({
      order: [['createdAt', 'ASC']],
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn(
              'concat',
              sequelize.col('firstUserId'),
              sequelize.col('secondUserId')
            ),
            {
              [Op.eq]: convId,
            }
          ),
          sequelize.where(
            sequelize.fn(
              'concat',
              sequelize.col('secondUserId'),
              sequelize.col('firstUserId')
            ),
            {
              [Op.eq]: convId,
            }
          ),
          // { email: { $like: '%' + req.body.query + '%' } },
          // { companyName: { $like: '%' + req.body.query + '%' } }
        ],
      },
      include: [
        {
          model: db.User,
          as: 'firstUser',
          attributes: ['firstName', 'familyName', 'photoUrl'],
        },
        {
          model: db.User,
          as: 'secondUser',
          attributes: ['firstName', 'familyName', 'photoUrl'],
        },
      ],
    });
    console.log(conversations);
    return res.status(200).json(conversations);
  } catch (err) {
    next(err);
  }
};

exports.getAllConversations = async (req, res, next) => {
  const userId = req.userId;
  try {
    const conversations = await db.Conversation.findAll({
      order: [['createdAt', 'ASC']],
      where: {
        [Op.and]: [{ unreadMessageSecondUser: 1 }, { secondUserId: userId }],
      },
    });
    return res.status(200).json(conversations);
  } catch (err) {
    next(err);
  }
};

exports.updateOneConversation = async (req, res, next) => {
  const userId = req.userId;
  const otherUserId = req.params.id;
  const convId = userId.toString() + otherUserId.toString();
  try {
    await db.Conversation.update(
      {
        unreadMessageSecondUser: 0,
      },
      {
        where: {
          [Op.or]: [
            sequelize.where(
              sequelize.fn(
                'concat',
                sequelize.col('secondUserId'),
                sequelize.col('firstUserId')
              ),
              {
                [Op.eq]: convId,
              }
            ),
            // { email: { $like: '%' + req.body.query + '%' } },
            // { companyName: { $like: '%' + req.body.query + '%' } }
          ],
        },
      }
    );
    return res.status(200).json('conversation updated');
  } catch (err) {
    next(err);
  }
  next(err);
};

exports.updateReceivedMessage = async (req, res, next) => {
  const userId = req.body.userId;
  const otherUserId = req.params.id;
  const convId = userId.toString() + otherUserId.toString();
  try {
    await db.Conversation.update(
      {
        unreadMessageSecondUser: 0,
      },
      {
        where: {
          [Op.or]: [
            sequelize.where(
              sequelize.fn(
                'concat',
                sequelize.col('secondUserId'),
                sequelize.col('firstUserId')
              ),
              {
                [Op.eq]: convId,
              }
            ),
            // { email: { $like: '%' + req.body.query + '%' } },
            // { companyName: { $like: '%' + req.body.query + '%' } }
          ],
        },
      }
    );
    return res.status(200).json('conversation updated');
  } catch (err) {
    next(err);
  }
  next(err);
};
