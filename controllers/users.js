const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const Token = db.Token;

const jwtSecret = () => process.env.JWT_SECRET || 'node237_secret';

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const userCount = await User.count();
        const role = userCount === 0 ? 'admin' : 'user';
        const user = await User.create({ name, email, password_hash, role, status: 'active' });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Error registering user', details: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email, status: 'active' } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret(), { expiresIn: '1d' });
        await user.update({ token_value: token });
        await Token.create({
            user_id: user.id,
            token_value: token,
            expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        return res.status(200).json({
            success: true,
            message: 'Welcome back',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error logging in', details: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'status', 'created_at']
        });
        return res.status(200).json({ rows: users });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching users' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({ role });
        return res.status(200).json({ success: true, message: 'User role updated', user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating role', details: error.message });
    }
};

exports.deactivateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({ status: 'inactive' });
        return res.status(200).json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deactivating user', details: error.message });
    }
};
