const passport = require('passport');

const kakao = require('./kakaoStrategy');
const google = require('./googleStrategy');

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  kakao();
  google();
};
