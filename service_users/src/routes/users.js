const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { users } = require('../db');
const { sign } = require('../utils/jwt');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  roles: z.array(z.string()).optional().default(['engineer'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    if ([...users.values()].some(u => u.email === data.email)) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
      });
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = {
      id: uuidv4(),
      email: data.email,
      password: hashed,
      name: data.name,
      roles: data.roles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.set(user.id, user);

    return res.status(201).json({ success: true, data: { id: user.id } });
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

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = [...users.values()].find(u => u.email === data.email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const token = sign({ userId: user.id, roles: user.roles });
    return res.json({ success: true, data: { token } });
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

router.get('/profile', (req, res) => {
  const userId = req.headers['x-user-id'];
  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
  }
  const { password, ...safeUser } = user;
  return res.json({ success: true, data: safeUser });
});

router.put('/profile', (req, res) => {
  const userId = req.headers['x-user-id'];
  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
  }
  user.name = req.body.name || user.name;
  user.updatedAt = new Date().toISOString();
  users.set(userId, user);
  const { password, ...safeUser } = user;
  return res.json({ success: true, data: safeUser });
});

module.exports = router;
