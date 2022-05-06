const kakaoLogin = (req, res) => {
  const { accessToken, refreshToken } = req.user;
  res
    .cookie('refresh_token', refreshToken, {
      httpOnly: true,
    })
    .redirect(`${process.env.CLIENT_URL}/?token=${accessToken}`);
};

const googleLogin = (req, res) => {
  const { accessToken, refreshToken } = req.user;
  res
    .cookie('refresh_token', refreshToken, {
      httpOnly: true,
    })
    .redirect(`${process.env.CLIENT_URL}/?token=${accessToken}`);
};

module.exports = {
  kakaoLogin,
  googleLogin,
};
