const sequelize = require('../config/database');
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
        const [rows] = await sequelize.query('SELECT id FROM users WHERE username = ? LIMIT 1', {
            replacements: [candidate]
        });

        if (!rows.length) {
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

        const [existing] = await sequelize.query('SELECT id FROM users WHERE email = ? LIMIT 1', {
            replacements: [email]
        });

        if (existing.length) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const firstName = first_name || (name ? name.split(' ')[0] : 'User');
        const lastName = last_name || (name ? name.split(' ').slice(1).join(' ') : 'User');
        const userName = username || buildUsername(name || email);
        const safeUsername = await ensureUniqueUsername(userName);

        const [result] = await sequelize.query(
            'INSERT INTO users (first_name, last_name, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            {
                replacements: [firstName, lastName, safeUsername, email, hashedPassword, role, 'active']
            }
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: result.insertId,
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

        const [users] = await sequelize.query(
            'SELECT id, first_name, last_name, email, password, role, status FROM users WHERE email = ? LIMIT 1',
            { replacements: [email] }
        );

        if (!users.length) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = users[0];
        if (user.status !== 'active') {
            return res.status(401).json({ success: false, message: 'Account is inactive' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'xrus-secret');
        await sequelize.query('UPDATE users SET token = ? WHERE id = ?', { replacements: [token, user.id] });

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
        const { fname, lname, addressline, phone } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const [users] = await sequelize.query('SELECT id FROM users WHERE id = ? LIMIT 1', { replacements: [userId] });
        if (!users.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        await sequelize.query(
            'UPDATE users SET first_name = ?, last_name = ?, address = ?, phone = ? WHERE id = ?',
            {
                replacements: [fname || null, lname || null, addressline || null, phone || null, userId]
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully'
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

        const [users] = await sequelize.query('SELECT id FROM users WHERE id = ? OR email = ? LIMIT 1', {
            replacements: [id, email]
        });

        if (!users.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        await sequelize.query('UPDATE users SET status = ?, token = NULL WHERE id = ?', {
            replacements: ['inactive', users[0].id]
        });

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

        const [users] = await sequelize.query('SELECT id FROM users WHERE id = ? LIMIT 1', {
            replacements: [id]
        });

        if (!users.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        await sequelize.query('UPDATE users SET status = ?, token = NULL WHERE id = ?', {
            replacements: [status, id]
        });

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

        const [existing] = await sequelize.query('SELECT id FROM users WHERE email = ? LIMIT 1', {
            replacements: [email]
        });

        if (existing.length) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const safeUsername = await ensureUniqueUsername(username || email.split('@')[0]);

        const [result] = await sequelize.query(
            'INSERT INTO users (first_name, last_name, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            {
                replacements: [first_name || '', last_name || '', safeUsername, email, hashedPassword, role, status]
            }
        );

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: result.insertId,
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
        const [rows] = await sequelize.query(
            'SELECT id, first_name, last_name, username, email, role, status, created_at FROM users ORDER BY id DESC'
        );

        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching users', details: error.message });
    }
};

const updateUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, username, email, role, status } = req.body;

        const [users] = await sequelize.query('SELECT id, username, email FROM users WHERE id = ? LIMIT 1', {
            replacements: [id]
        });

        if (!users.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentUser = users[0];
        const nextUsername = username || currentUser.username;
        const nextEmail = email || currentUser.email;
        const safeUsername = nextUsername === currentUser.username ? nextUsername : await ensureUniqueUsername(nextUsername);

        await sequelize.query(
            'UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ?, role = ?, status = ? WHERE id = ?',
            {
                replacements: [first_name || '', last_name || '', safeUsername, nextEmail, role || 'customer', status || 'active', id]
            }
        );

        return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating user', details: error.message });
    }
};

const deleteUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await sequelize.query('SELECT id FROM users WHERE id = ? LIMIT 1', { replacements: [id] });

        if (!users.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        await sequelize.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)', { replacements: [id] });
        await sequelize.query('DELETE FROM orders WHERE user_id = ?', { replacements: [id] });
        await sequelize.query('DELETE FROM users WHERE id = ?', { replacements: [id] });
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

        await sequelize.query('UPDATE users SET role = ? WHERE id = ?', { replacements: [role, id] });
        return res.status(200).json({ success: true, message: 'User role updated' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating user role', details: error.message });
    }
};

module.exports = { registerUser, loginUser, updateUser, deactivateUser, updateUserStatus, createUser, getAllUsers, updateUserByAdmin, deleteUserByAdmin, updateUserRole };
// const connection = require('../config/_database');
// const bcrypt = require('bcrypt')
// const jwt = require('jsonwebtoken')

// const registerUser = async (req, res) => {
//     // {
//     //   "name": "steve",
//     //   "email": "steve@gmail.com",
//     //   "password": "password"
//     // }
//     console.log(req.body)
//     const { name, password, email, } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const userSql = 'INSERT INTO users (name, password, email) VALUES (?, ?, ?)';
//     try {
//         connection.execute(userSql, [name, hashedPassword, email], (err, result) => {
//             if (err instanceof Error) {
//                 console.log(err);

//                 return res.status(401).json({
//                     error: err
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 result
//             })
//         });
//     } catch (error) {
//         console.log(error)
//     }

// };

// const loginUser = (req, res) => {
//     const { email, password } = req.body;
//     const sql = 'SELECT id, name, email, password FROM users WHERE email = ? AND deleted_at IS NULL';
//     connection.execute(sql, [email], async (err, results) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).json({ error: 'Error logging in', details: err });
//         }
//         if (results.length === 0) {
//             return res.status(401).json({ success: false, message: 'Invalid email or password' });
//         }

//         const user = results[0];

//         const match = await bcrypt.compare(password, user.password);
//         if (!match) {
//             return res.status(401).json({ success: false, message: 'Invalid email or password' });
//         }

//         // Remove password from response
//         delete user.password;
//         const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET,);

//         return res.status(200).json({
//             success: "welcome back",
//             user: results[0],
//             token
//         });
//     });
// };

// const updateUser = (req, res) => {
//     // {
//     //   "name": "steve",
//     //   "email": "steve@gmail.com",
//     //   "password": "password"
//     // }
//     console.log(req.body, req.file)
//     const { fname, lname, addressline, town, zipcode, phone, userId, } = req.body;

//     if (req.file) {
//         image = req.file.path.replace(/\\/g, "/");
//     }
//     //     INSERT INTO users(user_id, username, email)
//     //   VALUES(1, 'john_doe', 'john@example.com')
//     // ON DUPLICATE KEY UPDATE email = 'john@example.com';
//     const userSql = `
//   INSERT INTO customer 
//     (fname, lname, addressline,  zipcode, phone, image_path, user_id)
//   VALUES (?, ?, ?, ?, ?, ?, ?)
//   ON DUPLICATE KEY UPDATE 
//     fname = VALUES(fname),
//     lname = VALUES(lname),
//     addressline = VALUES(addressline),
   
//     zipcode = VALUES(zipcode),
//     phone = VALUES(phone),
//     image_path = VALUES(image_path)`;
//     const params = [fname, lname, addressline, zipcode, phone, image, userId];

//     try {
//         connection.execute(userSql, params, (err, result) => {
//             if (err instanceof Error) {
//                 console.log(err);

//                 return res.status(401).json({
//                     error: err
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 message: 'profile updated',
//                 result
//             })
//         });
//     } catch (error) {
//         console.log(error)
//     }

// };

// const deactivateUser = (req, res) => {
//     const { email } = req.body;
//     if (!email) {
//         return res.status(400).json({ error: 'Email is required' });
//     }

//     const sql = 'UPDATE users SET deleted_at = ? WHERE email = ?';
//     const timestamp = new Date();

//     connection.execute(sql, [timestamp, email], (err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).json({ error: 'Error deactivating user', details: err });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         return res.status(200).json({
//             success: true,
//             message: 'User deactivated successfully',
//             email,
//             deleted_at: timestamp
//         });
//     });
// };

// module.exports = { registerUser, loginUser, updateUser, deactivateUser };
