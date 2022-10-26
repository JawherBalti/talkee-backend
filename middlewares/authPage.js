const cryptojs = require('crypto-js');
const Cookies = require('cookies');
const db = require('../models');

exports.authPage = (req, res, next) => {
  const cryptedCookie = new Cookies(req, res).get('snToken');
  const cookie = JSON.parse(
    cryptojs.AES.decrypt(cryptedCookie, process.env.COOKIE_KEY).toString(
      cryptojs.enc.Utf8
    )
  );
  const id = cookie.userId;

  db.User.findByPk(id)
    .then((user) => {
      if (user.role == 1) {
        next();
      } else {
        res.status(401).json({
          message: 'This user has no authorization to access this page !',
        });
      }
    })
    .catch(() => res.status(400).json({ message: 'Could not find user !' }));
};
