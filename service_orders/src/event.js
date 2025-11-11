// Заготовка для брокера (в логах пока)
const pino = require('pino');
const logger = pino();

function emitOrderCreated(order) {
  logger.info({ event: 'order.created', orderId: order.id, userId: order.userId });
}

function emitOrderStatusUpdated(order) {
  logger.info({ event: 'order.status.updated', orderId: order.id, status: order.status });
}

module.exports = { emitOrderCreated, emitOrderStatusUpdated };
