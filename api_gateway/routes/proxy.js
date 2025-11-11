// api_gateway/src/routes/proxy.js
const proxy = require('express-http-proxy');

const USERS_SERVICE = process.env.USERS_SERVICE_URL || 'http://service_users:3001';
const ORDERS_SERVICE = process.env.ORDERS_SERVICE_URL || 'http://service_orders:3002';

function safeHeader(value) {
  return value == null ? '' : String(value);
}

function setupProxy(app) {
  // Проксируем /v1/users → в USERS_SERVICE, сохраняя путь
  app.use('/v1/users', proxy(USERS_SERVICE, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['x-request-id'] = safeHeader(srcReq.id);
      proxyReqOpts.headers['x-user-id'] = safeHeader(srcReq.userId);
      proxyReqOpts.headers['x-user-roles'] = safeHeader(JSON.stringify(srcReq.userRoles || []));
      return proxyReqOpts;
    }
  }));

  app.use('/v1/orders', proxy(ORDERS_SERVICE, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['x-request-id'] = safeHeader(srcReq.id);
      proxyReqOpts.headers['x-user-id'] = safeHeader(srcReq.userId);
      proxyReqOpts.headers['x-user-roles'] = safeHeader(JSON.stringify(srcReq.userRoles || []));
      return proxyReqOpts;
    }
  }));
}

module.exports = setupProxy;
