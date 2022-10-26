const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    let extension = path.extname(file.originalname);
    let name = file.originalname
      .split(' ')
      .join('_')
      .slice(0, -extension.length);
    cb(null, name + '_' + Date.now() + extension);
  },
});

const MAX_SIZE = 1 * 1024 * 1024; // for 1MB

// Validation
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    //allowed extension
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      //cb(null, false);
      //return cb(new Error('Only .png, .jpg, .jpeg and .gif format allowed!'));
      return cb('Only .png, .jpg, .jpeg and .gif format allowed!');
    }
  },
  limits: { fileSize: MAX_SIZE },
}).single('image');

module.exports = upload;
