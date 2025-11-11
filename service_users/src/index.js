const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ requestId: (req) => req.headers['x-request-id'] || 'unknown' }));

// 👇 Роутер — ДО любого 404!
app.use(usersRouter); // ← уберите префикс!

// 👇 Только после — 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Users service running on port ${PORT}`);
});
