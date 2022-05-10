const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const { createUserOrLogin } = require('../utils/auth');
const { saveRefreshTokenToDB } = require('../utils/jwt');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIERECT_URI,
  GOOGLE_REDIERECT_URI_DEV,
  NODE_ENV,
} = process.env;

module.exports = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL:
          NODE_ENV === 'development'
            ? GOOGLE_REDIERECT_URI_DEV
            : GOOGLE_REDIERECT_URI,
      },
      async (accessToken, refreshToken, profile, done) => {
        const user = await createUserOrLogin({
          platform: 'google',
          platformId: profile.id,
          name: profile._json.name,
          profileImageURL: profile._json.picture,
          email: profile._json.email,
        });

        await saveRefreshTokenToDB(user.userId, user.refreshToken);

        done(null, user);
      }
    )
  );
};
