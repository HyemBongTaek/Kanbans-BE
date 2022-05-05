const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const { createUserOrLogin } = require('../utils/auth');

const { KAKAO_REST_KEY, KAKAO_REDIRECT_URI } = process.env;

module.exports = () => {
  passport.use(
    new KakaoStrategy(
      {
        clientID: KAKAO_REST_KEY,
        callbackURL: KAKAO_REDIRECT_URI,
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

        return done(null, user);
      }
    )
  );
};
