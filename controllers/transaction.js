const db = require('../config/database');
const { generateReceiptPdf } = require('../utils/sendEmail');

exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch orders' });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { amount, status = 'pending' } = req.body;
    const [result] = await db.promise().query(
      'INSERT INTO transactions (user_id, amount, status) VALUES (?, ?, ?)',
      [req.user.id, amount, status]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to place order' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to get order' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { status } = req.body;
    await db.promise().query('UPDATE transactions SET status = ? WHERE id = ? AND user_id = ?', [status, req.params.id, req.user.id]);

    const [rows] = await db.promise().query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const transaction = rows[0];

    const pdfPath = await generateReceiptPdf(transaction);
    await db.promise().query('UPDATE transactions SET receipt_path = ? WHERE id = ?', [pdfPath, transaction.id]);

    res.json({ message: 'Transaction updated', receipt: pdfPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update transaction' });
  }
};
