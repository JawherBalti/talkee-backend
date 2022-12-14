'use strict';

const express = require('express');
const router = express.Router();
const { checkUser, refreshToken } = require('../middlewares/authUser');
const { authPage } = require('../middlewares/authPage');
const userControl = require('../controllers/userController');
const multer = require('../middlewares/multer-config');
const validateSignup = require('../middlewares/validateSignup');
const upload = require('../middlewares/multer-config');

// user auth
//router.post("/signup", validateSignup, upload, userControl.signup);
router.post('/signup', upload, validateSignup.register, userControl.signup);
router.post('/login', userControl.login);
router.post('/logout', checkUser, userControl.logout);

// user CRUD
router.get('/', checkUser, userControl.getAllUsers);
router.get('/:id', checkUser, userControl.getOneUser);
router.put('/:id', checkUser, upload, userControl.updateUser);
router.put('/banner/:id', checkUser, upload, userControl.updateBanner);
router.put('/pwd/:id', checkUser, userControl.updatePwd);
// router.delete("/:id", checkUser, authPage(1), userControl.deleteUser);
router.delete('/:id', checkUser, userControl.deleteUser);
router.post('/search', checkUser, userControl.searchUser);

module.exports = router;
