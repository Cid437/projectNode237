const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.body.token;
  if (!token) return res.status(401).json({ message: 'Token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const [rows] = await db.promise().query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid token user' });
    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};
