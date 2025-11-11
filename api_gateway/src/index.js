// api_gateway/src/index.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const requestIdMiddleware = require('./middlewares/requestId');
const authMiddleware = require('./middlewares/auth');
const setupProxy = require('./routes/proxy');

const app = express();

// Безопасность и логирование
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ requestId: (req) => req.id }));

// Middleware
app.use(requestIdMiddleware);
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(authMiddleware); // ← проверка JWT здесь

// Прокси
setupProxy(app);



// Обработчик 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' }
  });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
});
