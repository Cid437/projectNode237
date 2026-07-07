const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');

exports.isAuthenticatedUser = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.headers.token) {
        token = req.headers.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xrus-secret');
        const [users] = await sequelize.query(
            'SELECT id, email, role, status, token FROM users WHERE id = ? AND status = ? LIMIT 1',
            { replacements: [decoded.id, 'active'] }
        );

        if (!users.length) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        if (users[0].token !== token) {
            return res.status(401).json({ message: 'Session expired. Please login again.' });
        }

        req.user = users[0];
        req.body = req.body || {};
        req.body.user = { id: users[0].id, role: users[0].role };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please login again.' });
        }
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

