// api_gateway/src/middlewares/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function authMiddleware(req, res, next) {
  // Публичные маршруты (доступны без токена)
  const publicRoutes = [
    { path: '/v1/users/register', method: 'POST' },
    { path: '/v1/users/login', method: 'POST' }
  ];

  const isPublic = publicRoutes.some(route =>
    req.path === route.path && req.method === route.method
  );

  if (isPublic) {
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' }
    });
  }

  const token = auth.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.userRoles = payload.roles;
  } catch (e) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token verification failed' }
    });
  }

  next();
}

module.exports = authMiddleware;
