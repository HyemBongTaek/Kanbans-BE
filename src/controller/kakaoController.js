const kakaoLogin = (req, res) => {
  const { accessToken, refreshToken } = req.user;
  res
    .cookie('refresh_token', refreshToken)
    .redirect(`${process.env.CLIENT_URL}/?token=${accessToken}`);
};

module.exports = {
  kakaoLogin,
};
