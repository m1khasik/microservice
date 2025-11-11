const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ requestId: (req) => req.headers['x-request-id'] || 'unknown' }));

// Просто доверяем заголовку от шлюза
app.use((req, res, next) => {
  // x-user-id и x-user-roles устанавливает шлюз
  next();
});

app.use(ordersRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Orders service running on port ${PORT}`);
});
