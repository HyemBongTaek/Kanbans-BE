const passport = require('passport');

const kakao = require('./kakaoStrategy');

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  kakao();
};
