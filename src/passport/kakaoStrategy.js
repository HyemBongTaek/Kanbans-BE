const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const { createUserOrLogin } = require('../utils/auth');
const { saveRefreshTokenToDB } = require('../utils/jwt');

const { KAKAO_REST_KEY, KAKAO_REDIRECT_URI, KAKAO_REDIRECT_URI_DEV, NODE_ENV } =
  process.env;

module.exports = () => {
  passport.use(
    new KakaoStrategy(
      {
        clientID: KAKAO_REST_KEY,
        callbackURL:
          NODE_ENV === 'development'
            ? KAKAO_REDIRECT_URI_DEV
            : KAKAO_REDIRECT_URI,
      },
      async (accessToken, refreshToken, profile, done) => {
        const user = await createUserOrLogin({
          platform: 'kakao',
          platformId: profile.id.toString(),
          name: profile.username,
          profileImageURL:
            profile._json.kakao_account.profile.profile_image_url,
          email: profile._json.kakao_account.email,
        });

        await saveRefreshTokenToDB(user.userId, user.refreshToken);

        return done(null, user);
      }
    )
  );
};
