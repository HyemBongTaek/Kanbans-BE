const { verifyJWT } = require('../utils/jwt');

const auth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    const error = new Error('Jwt must be provided');
    error.statusCode = 401;
    next(error);
    return;
  }

  const [tokenType, token] = authorization.split(' ');

  if (tokenType !== 'Bearer') {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    next(error);
    return;
  }

  try {
    const verifiedToken = await verifyJWT(token);
    req.userId = verifiedToken.id;
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
    } else {
      const error = new Error(err.message);
      next(error);
    }
  }
};

module.exports = {
  auth,
};
