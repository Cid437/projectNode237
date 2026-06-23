const db = require('../config/database');

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT id, name FROM categories ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load categories' });
  }
};
