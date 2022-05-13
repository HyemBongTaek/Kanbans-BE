const multer = require('multer');

const filter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: filter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const profileUpload = upload.single('profileImage');

module.exports = {
  profileUpload,
};
