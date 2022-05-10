const { verifyJWT } = require('../utils/jwt');

const auth = async (req, res, next) => {
  const { authorization } = req.headers;
  console.log(authorization);

  if (!authorization) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    next(error);
    return;
  }

  const [tokenType, token] = authorization.split(' ');

  if (tokenType !== 'Bearer') {
    res.status(401).json({
      ok: false,
      message: 'Not authenticated',
    });
    return;
  }

  try {
    const verifiedToken = await verifyJWT(token);
    req.userId = verifiedToken.id;
    next();
  } catch (err) {
    if (err.message === 'jwt expired') {
      res.status(401).json({
        ok: false,
        message: 'Jwt expired',
      });
    } else if (err.message === 'invalid signature') {
      res.status(401).json({
        ok: false,
        message: 'Token invalid',
      });
    } else {
      res.json({
        ok: false,
        message: err.message,
      });
    }
  }
};

module.exports = {
  auth,
};
