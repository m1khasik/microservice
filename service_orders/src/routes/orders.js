const express = require('express');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { orders } = require('../db');
const { emitOrderCreated, emitOrderStatusUpdated } = require('../events');

const router = express.Router();

const createOrderSchema = z.object({
  items: z.array(z.object({
    product: z.string().min(1),
    quantity: z.number().int().positive()
  })).min(1)
});

const allowedStatuses = ['created', 'in_progress', 'completed', 'cancelled'];

router.post('/', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      });
    }

    const data = createOrderSchema.parse(req.body);

    const total = data.items.reduce((sum, item) => sum + item.quantity * 100, 0); // условная цена

    const order = {
      id: uuidv4(),
      userId,
      items: data.items,
      status: 'created',
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.set(order.id, order);
    emitOrderCreated(order);

    return res.status(201).json({ success: true, data: order });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: e.errors }
      });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Server error' } });
  }
});

router.get('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' }
    });
  }
  if (order.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' }
    });
  }
  return res.json({ success: true, data: order });
});

router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const userOrders = [...orders.values()].filter(o => o.userId === userId);
  const total = userOrders.length;
  const paginated = userOrders.slice(offset, offset + limit);

  return res.json({
    success: true,
    data: {
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

router.patch('/:id/cancel', (req, res) => {
  const userId = req.headers['x-user-id'];
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' }
    });
  }
  if (order.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' }
    });
  }
  if (order.status === 'cancelled') {
    return res.json({ success: true, data: order });
  }
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  orders.set(order.id, order);
  emitOrderStatusUpdated(order);
  return res.json({ success: true, data: order });
});

router.patch('/:id/status', (req, res) => {
  const userId = req.headers['x-user-id'];
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' }
    });
  }
  if (order.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' }
    });
  }
  const { status } = req.body;
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Invalid status' }
    });
  }
  order.status = status;
  order.updatedAt = new Date().toISOString();
  orders.set(order.id, order);
  emitOrderStatusUpdated(order);
  return res.json({ success: true, data: order });
});

module.exports = router;
