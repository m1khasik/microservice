const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

function verify(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
