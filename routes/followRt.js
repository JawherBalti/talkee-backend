const express = require('express');
const router = express.Router();
const followCtrl = require('../controllers/followController');
const { checkUser } = require('../middlewares/authUser');

router.post('/:id', checkUser, followCtrl.follow);
router.delete('/:id', checkUser, followCtrl.unFollow);

module.exports = router;
