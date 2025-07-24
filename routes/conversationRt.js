const express = require('express');
const router = express.Router();
const conversationCtrl = require('../controllers/conversationController');
const { checkUser } = require('../middlewares/authUser');

router.post('/:id', checkUser, conversationCtrl.createConversation);
router.get('/:id', checkUser, conversationCtrl.getOneConversation);
router.get('/', checkUser, conversationCtrl.getAllConversations);
router.get('/unread-counts', checkUser, conversationCtrl.getUnreadCounts);
router.put('/:id', checkUser, conversationCtrl.updateOneConversation);
router.put('/message/:id', checkUser, conversationCtrl.updateReceivedMessage);
module.exports = router;
