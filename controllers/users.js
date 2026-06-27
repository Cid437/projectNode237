const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendReceiptEmail } = require('../utils/sendEmail');

const createToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role }, 
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '8h' }
  );
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const [existing] = await db.promise().query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, password_hash, status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, email, password_hash, 'active']
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: result.insertId, name, email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to register user' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordHash = user.password_hash || user.password;
    const safePasswordHash = passwordHash.replace(/^\$2y\$/, '$2b$');
    const match = await bcrypt.compare(password, safePasswordHash);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status && user.status !== 'active') {
      return res.status(403).json({ message: 'User account is not active' });
    }

    const token = createToken(user);
    await db.promise().query('UPDATE users SET token = ? WHERE id = ?', [token, user.id]);

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to login' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { title, fname, lname, addressline, zipcode, town, phone } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const imagePath = req.file ? req.file.path.replace(/\\/g, '/').replace(/^public\//, '') : null;
    const [existingRows] = await db.promise().query('SELECT * FROM customer WHERE user_id = ?', [userId]);

    if (existingRows.length > 0) {
      const customer = existingRows[0];
      await db.promise().query(
        `UPDATE customer SET
          title = ?,
          fname = ?,
          lname = ?,
          addressline = ?,
          zipcode = ?,
          town = ?,
          phone = ?,
          image_path = ?
        WHERE user_id = ?`,
        [
          title ?? customer.title,
          fname ?? customer.fname,
          lname ?? customer.lname,
          addressline ?? customer.addressline,
          zipcode ?? customer.zipcode,
          town ?? customer.town,
          phone ?? customer.phone,
          imagePath ?? customer.image_path,
          userId
        ]
      );
    } else {
      await db.promise().query(
        `INSERT INTO customer (title, fname, lname, addressline, zipcode, town, phone, image_path, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title || null, fname || null, lname || null, addressline || null, zipcode || null, town || null, phone || null, imagePath || null, userId]
      );
    }

    const [customerRows] = await db.promise().query('SELECT * FROM customer WHERE user_id = ?', [userId]);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      customer: customerRows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating profile', details: error.message });
  }
};

exports.deactivateUserAccount = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password are required' });
    }

    const [rows] = await db.promise().query('SELECT id, password_hash, password, status FROM users WHERE id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    const passwordHash = (user.password_hash || user.password || '').replace(/^\$2y\$/, '$2b$');
    const match = await bcrypt.compare(password, passwordHash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await db.promise().query('UPDATE users SET status = ?, token = NULL WHERE id = ?', ['inactive', userId]);
    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      userId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deactivating user', details: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load profile' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT id, name, email, role, status, created_at FROM users');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch users' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await db.promise().query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Role updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update user role' });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.promise().query('UPDATE users SET status = ? WHERE id = ?', ['inactive', id]);
    res.json({ message: 'User deactivated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to deactivate user' });
  }
};
