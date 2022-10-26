const express = require('express');
const router = express.Router();
const messageCtrl = require('../controllers/messageController');
const { checkUser } = require('../middlewares/authUser');

router.get('/:id', checkUser, messageCtrl.getAllMessages);
router.post('/:id', checkUser, messageCtrl.createMessage);

module.exports = router;
