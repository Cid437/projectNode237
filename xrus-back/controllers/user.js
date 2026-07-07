const sequelize = require('../config/database');
const db = require('../models');
const { User } = db;
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const buildUsername = (value) => {
    const base = (value || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${base || 'user'}${Math.floor(1000 + Math.random() * 9000)}`;
};

const ensureUniqueUsername = async (value) => {
    let candidate = (value || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
    let suffix = 0;

    while (true) {
        const existing = await User.findOne({ where: { username: candidate }, attributes: ['id'] });

        if (!existing) {
            return candidate;
        }

        suffix += 1;
        candidate = `${candidate}${suffix}`;
    }
};

const registerUser = async (req, res) => {
    try {
        const { name, first_name, last_name, username, email, password, role = 'customer' } = req.body;

        if (!email || !password || (!name && !first_name && !last_name && !username)) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const existing = await User.findOne({ where: { email }, attributes: ['id'] });
        if (existing) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const firstName = first_name || (name ? name.split(' ')[0] : 'User');
        const lastName = last_name || (name ? name.split(' ').slice(1).join(' ') : 'User');
        const userName = username || buildUsername(name || email);
        const safeUsername = await ensureUniqueUsername(userName);

        const user = await User.create({
            first_name: firstName,
            last_name: lastName,
            username: safeUsername,
            email,
            password: hashedPassword,
            role,
            status: 'active'
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                email
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error registering user', details: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ success: false, message: 'Account is inactive' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'xrus-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );
        await user.update({ token });

        return res.status(200).json({
            success: true,
            message: 'Welcome back',
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
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

const updateUser = async (req, res) => {
    try {
        const userId = req.body.userId || req.body.user?.id || req.body.user_id;
        const { fname, lname, addressline, phone, town, zipcode } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updateData = {
            first_name: fname || null,
            last_name: lname || null,
            address: addressline || null,
            phone: phone || null,
            town: town || null,
            zipcode: zipcode || null
        };

        if (req.file) {
            updateData.image_url = `/images/${req.file.filename}`;
        }

        await user.update(updateData);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                first_name: updateData.first_name,
                last_name: updateData.last_name,
                address: updateData.address,
                phone: updateData.phone,
                town: updateData.town,
                zipcode: updateData.zipcode,
                image_url: updateData.image_url || user.image_url
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating profile', details: error.message });
    }
};

const deactivateUser = async (req, res) => {
    try {
        const { email, id } = req.body;

        if (!email && !id) {
            return res.status(400).json({ error: 'Email or ID is required' });
        }

        const user = await User.findOne({
            where: { [Op.or]: [{ id: id || 0 }, { email: email || '' }] }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({ status: 'inactive', token: null });

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deactivating user', details: error.message });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = req.body?.status || req.body?.state;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Status must be active or inactive' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({ status, token: null });

        return res.status(200).json({
            success: true,
            message: status === 'active' ? 'User activated successfully' : 'User deactivated successfully'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating user status', details: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { first_name, last_name, username, email, password, role = 'customer', status = 'active' } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await User.findOne({ where: { email }, attributes: ['id'] });
        if (existing) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const safeUsername = await ensureUniqueUsername(username || email.split('@')[0]);

        const user = await User.create({
            first_name: first_name || '',
            last_name: last_name || '',
            username: safeUsername,
            email,
            password: hashedPassword,
            role,
            status
        });

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user.id,
                first_name: first_name || '',
                last_name: last_name || '',
                email,
                role,
                status
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error creating user', details: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'role', 'status', 'created_at'],
            order: [['id', 'DESC']]
        });

        return res.status(200).json({ rows: users });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching users', details: error.message });
    }
};

const updateUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, username, email, role, status } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const nextUsername = username || user.username;
        const nextEmail = email || user.email;
        const safeUsername = nextUsername === user.username ? nextUsername : await ensureUniqueUsername(nextUsername);

        await user.update({
            first_name: first_name || '',
            last_name: last_name || '',
            username: safeUsername,
            email: nextEmail,
            role: role || 'customer',
            status: status || 'active'
        });

        return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating user', details: error.message });
    }
};

const deleteUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // orders/order_items now have models (mp7), so this uses the ORM
        // instead of raw queries like before.
        const userOrders = await db.Order.findAll({ where: { user_id: id }, attributes: ['id'], raw: true });
        const orderIds = userOrders.map((o) => o.id);

        if (orderIds.length) {
            await db.OrderItem.destroy({ where: { order_id: orderIds } });
        }
        await db.Order.destroy({ where: { user_id: id } });
        await user.destroy();

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deleting user', details: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        await User.update({ role }, { where: { id } });
        return res.status(200).json({ success: true, message: 'User role updated' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating user role', details: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'phone', 'address', 'town', 'zipcode', 'role', 'image_url']
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching profile', details: error.message });
    }
};

module.exports = { registerUser, loginUser, updateUser, deactivateUser, updateUserStatus, createUser, getAllUsers, updateUserByAdmin, deleteUserByAdmin, updateUserRole, getProfile };