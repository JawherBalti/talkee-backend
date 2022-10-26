const db = require('../models');

exports.createMessage = async (req, res, next) => {
  const userId = req.userId;
  const conversationId = req.params.id;
  const { message } = req.body;
  try {
    const conversation = await db.Conversation.findByPk(conversationId);
    const newMessage = await db.Message.create({
      message,
      conversationId: conversation.id,
      senderId: userId,
    });
    return res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
};

exports.getAllMessages = async (req, res, next) => {
  const userId = req.userId;
  const conversationId = req.params.id;
  try {
    const conversation = await db.Conversation.findByPk(conversationId);
    const messages = await db.Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: db.User,
          attributes: ['id', 'firstName', 'familyName', 'photoUrl'],
        },
      ],
    });
    if (userId === conversation.firstUserId)
      conversation.update({ unreadMessageFirstUser: 0 });
    else conversation.update({ unreadMessageSecondUser: 0 });
    return res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
};
