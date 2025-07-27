const jwt = require('jsonwebtoken');
const db = require('../models');

const cryptojs = require('crypto-js');
const Cookies = require('cookies');

const User = db.User;

// identifier le user et vérifier son token
exports.checkUser = (req, res, next) => {
  try {
    const cookies = req.headers.cookie;
    
    // Check if cookies exist
    if (!cookies) {
      return handleAuthError(req, res, 'No cookies found');
    }

    // Parse cookies to get snToken
    const cookiesArray = cookies.split(';');
    let snToken = null;

    for (const cookie of cookiesArray) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'snToken') {
        snToken = value;
        break;
      }
    }

    if (!snToken) {
      return handleAuthError(req, res, 'No authentication token found');
    }

    jwt.verify(snToken, process.env.COOKIE_KEY, (err, user) => {
      if (err) {
        return handleAuthError(req, res, 'Invalid or expired token');
      }
      req.userId = user.userId;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return handleAuthError(req, res, 'Internal server error');
  }
};

// In your middleware (backend)
function handleAuthError(req, res, message) {
  // Always return JSON for API errors
  return res.status(401).json({ 
    message,
    code: 'TOKEN_EXPIRED_OR_INVALID'
  });
}

exports.refreshToken = async (req, res, next) => {
  try {
    const cookies = req.headers.cookie;
    const prevToken = cookies.split('=')[1];
    if (!prevToken) {
      res.status(404).json({ message: 'No Token Found !' });
    }
    jwt.verify(prevToken, process.env.COOKIE_KEY, (err, user) => {
      if (err) return res.status(400).json({ message: 'Invalid Token ! ' });
      res.clearCookie('snToken');
      req.cookies['snToken'] = '';
      const token = jwt.sign({ userId: user.userId }, process.env.COOKIE_KEY, {
        expiresIn: '24h',
      });

      res.cookie('snToken', token, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24, //24h
        httpOnly: true,
        sameSite: 'lax',
      });

      req.userId = user.userId;
      next();
    });
  } catch (error) {
    res.status(401).json('An error occured !');
  }
};

// contrôler l'utilisateur et via la route get /jwtid envoyer au frontend le id (res.locals.user.id)
module.exports.requireAuth = async (req, res, next) => {
  const cryptedToken = req.cookies.snToken;

  const tokenDecrypted = cryptojs.AES.decrypt(
    cryptedToken,
    process.env.COOKIE_KEY
  );
  const cookie = JSON.parse(tokenDecrypted.toString(cryptojs.enc.Utf8));
  const token = cookie.token;

  if (token) {
    jwt.verify(token, process.env.COOKIE_KEY, (err, verifiedJwt) => {
      if (err) {
        res.send(200).json('No token found !');
        next();
      } else {
        next();
      }
    });
  } else {
    console.log('No token found !');
  }
};
