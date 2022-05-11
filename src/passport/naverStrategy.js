const passport = require('passport');
const NaverStrategy = require('passport-naver').Strategy;

const { createUserOrLogin } = require('../utils/auth');
const { saveRefreshTokenToDB } = require('../utils/jwt');

const {
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
  NAVER_REDIERECT_URI,
  NAVER_REDIERECT_URI_DEV,
  NODE_ENV,
} = process.env;

module.exports = () => {
  passport.use(
    new NaverStrategy(
      {
        clientID: NAVER_CLIENT_ID,
        clientSecret: NAVER_CLIENT_SECRET,
        callbackURL:
          NODE_ENV === 'development'
            ? NAVER_REDIERECT_URI_DEV
            : NAVER_REDIERECT_URI,
      },
      async (accessToken, refreshToken, profile, done) => {
        const user = await createUserOrLogin({
          platform: 'naver',
          platformId: profile.id,
          name: profile.displayName,
          profileImageURL: profile._json.profile_image,
          email: profile._json.email,
        });
        await saveRefreshTokenToDB(user.userId, user.refreshToken);
        done(null, user);
      }
    )
  );
};
