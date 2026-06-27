const db = require('../config/database');

exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch users' });
  }
};

exports.listItems = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT items.id, items.name, items.description, items.price, items.stock, items.category_id, categories.name AS category
       FROM items
       LEFT JOIN categories ON items.category_id = categories.id
       ORDER BY items.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch items' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;
    const [result] = await db.promise().query(
      'INSERT INTO items (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock, category_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Item created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to create item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id } = req.body;
    await db.promise().query(
      'UPDATE items SET name = ?, description = ?, price = ?, stock = ?, category_id = ? WHERE id = ?',
      [name, description, price, stock, category_id, id]
    );
    res.json({ message: 'Item updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update item' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.promise().query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete item' });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT id, user_id, amount, status, transaction_date, receipt_path FROM transactions ORDER BY transaction_date DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.promise().query('UPDATE transactions SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update order status' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await db.promise().query('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete order' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.promise().query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    if (password) {
      const bcrypt = require('bcrypt');
      const password_hash = await bcrypt.hash(password, 10);
      await db.promise().query(
        'UPDATE users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?',
        [name, email, role, password_hash, id]
      );
    } else {
      await db.promise().query(
        'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
        [name, email, role, id]
      );
    }

    res.json({ message: 'User updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update user' });
  }
};
