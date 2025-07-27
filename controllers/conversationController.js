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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await db.Conversation.findAndCountAll({
      order: [['createdAt', 'DESC']], // Get newest messages first
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn(
              'concat',
              sequelize.col('firstUserId'),
              sequelize.col('secondUserId')
            ),
            { [Op.eq]: convId }
          ),
          sequelize.where(
            sequelize.fn(
              'concat',
              sequelize.col('secondUserId'),
              sequelize.col('firstUserId')
            ),
            { [Op.eq]: convId }
          ),
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
      limit,
      offset,
    });

    return res.status(200).json({
      messages: rows.reverse(), // Reverse to get oldest first in the batch
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

// In your conversation controller

exports.getAllConversations = async (req, res, next) => {
  const userId = req.userId;
  try {
    // First get all conversations for the user
    const conversations = await db.Conversation.findAll({
      where: {
        [Op.or]: [
          { firstUserId: userId },
          { secondUserId: userId }
        ]
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
      order: [['updatedAt', 'DESC']]
    });

    // Then group them by conversation pair and calculate unread counts
    const groupedConversations = conversations.reduce((acc, conv) => {
      const otherUserId = conv.firstUserId === userId ? conv.secondUserId : conv.firstUserId;
      const key = `${Math.min(conv.firstUserId, conv.secondUserId)}-${Math.max(conv.firstUserId, conv.secondUserId)}`;
      
      if (!acc[key]) {
        acc[key] = {
          ...conv.get({ plain: true }),
          unreadCount: 0,
          totalMessages: 0
        };
      }
      
      acc[key].totalMessages++;
      
      if ((conv.firstUserId === userId && conv.unreadMessageFirstUser) ||
          (conv.secondUserId === userId && conv.unreadMessageSecondUser)) {
        acc[key].unreadCount++;
      }
      
      // Keep the most recent message
      if (new Date(conv.updatedAt) > new Date(acc[key].updatedAt)) {
        acc[key].message = conv.message;
        acc[key].updatedAt = conv.updatedAt;
        acc[key].senderId = conv.senderId;
      }
      
      return acc;
    }, {});

    return res.status(200).json(Object.values(groupedConversations));
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

// 1. First, modify your backend to have a dedicated endpoint for unread counts
exports.getUnreadCounts = async (req, res, next) => {
  const userId = req.userId;
  try {
    const counts = await db.Conversation.findAll({
      attributes: [
        [sequelize.literal(`CASE 
          WHEN firstUserId = ${userId} THEN secondUserId 
          ELSE firstUserId 
        END`), 'otherUserId'],
        [sequelize.fn('SUM', 
          sequelize.literal(`CASE WHEN (
            (firstUserId = ${userId} AND unreadMessageFirstUser = 1) OR 
            (secondUserId = ${userId} AND unreadMessageSecondUser = 1)
          ) THEN 1 ELSE 0 END`)
        ), 'unreadCount']
      ],
      where: {
        [Op.or]: [
          { firstUserId: userId },
          { secondUserId: userId }
        ]
      },
      group: [sequelize.literal(`CASE 
        WHEN firstUserId = ${userId} THEN secondUserId 
        ELSE firstUserId 
      END`)],
      raw: true
    });


    
    // Return just the array without pagination wrapper
    return res.status(200).json(counts);
  } catch (err) {
    next(err);
  }
};