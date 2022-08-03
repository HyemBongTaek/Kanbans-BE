const { verifyJWT } = require('../utils/jwt');

const auth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({
      ok: false,
      message: 'Jwt must be provided',
    });
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
    req.user = {
      id: verifiedToken.id,
      name: verifiedToken.name,
    };
    next();
  } catch (err) {
    if (err.message === 'jwt expired') {
      const error = new Error('Jwt expired');
      error.statusCode = 401;
      next(error);
    } else if (err.message === 'invalid signature') {
      const error = new Error('Invalid signature');
      error.statusCode = 401;
      next(error);
    } else if (err.message === 'jwt malformed') {
      const error = new Error('Jwt malformed');
      error.statusCode = 401;
      next(error);
    } else {
      const error = new Error(err.message);
      next(error);
    }
  }
};

module.exports = {
  auth,
};
