const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

const jwtSecret = () => process.env.JWT_SECRET || 'node237_secret';

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        if (!req.header('Authorization')) {
            return res.status(401).json({ message: 'Login first to access this resource' });
        }

        const token = req.header('Authorization').split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret());
        const user = await User.findOne({
            where: {
                id: decoded.id,
                status: 'active'
            }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid token or inactive user' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Admin role required' });
        }
        next();
    };
};
