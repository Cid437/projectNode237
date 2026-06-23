const db = require('../config/database');

exports.getItems = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT items.id, items.name, items.description, items.price, items.stock, categories.name AS category
       FROM items
       LEFT JOIN categories ON items.category_id = categories.id
       ORDER BY items.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load items' });
  }
};

exports.searchItems = async (req, res) => {
  try {
    const query = `%${(req.query.q || '').trim()}%`;
    const [rows] = await db.promise().query(
      `SELECT id, name, description, price, stock FROM items
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY name LIMIT 20`,
      [query, query]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Search failed' });
  }
};

exports.uploadItemImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Upload file required' });
    }
    const { id } = req.params;
    const filepath = `/uploads/items/${req.file.filename}`;
    await db.promise().query(
      'INSERT INTO item_images (item_id, filename, filepath, filetype) VALUES (?, ?, ?, ?)',
      [id, req.file.originalname, filepath, req.file.mimetype]
    );
    res.json({ message: 'Image uploaded', filepath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to upload image' });
  }
};
