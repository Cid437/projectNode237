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

exports.getAllItems = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT items.id, items.name, items.description, items.price, items.stock, categories.name AS category
       FROM items
       LEFT JOIN categories ON items.category_id = categories.id
       ORDER BY items.created_at DESC`
    );
    res.status(200).json({ rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching items' });
  }
};

exports.getSingleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.promise().query(
      `SELECT items.id, items.name, items.description, items.price, items.stock, categories.name AS category
       FROM items
       LEFT JOIN categories ON items.category_id = categories.id
       WHERE items.id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    return res.status(200).json({ success: true, result: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error fetching item' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;
    let imagePath;

    if (!name || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (req.file) {
      imagePath = `/uploads/items/${req.file.filename}`;
    }

    const [result] = await db.promise().query(
      'INSERT INTO items (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, price, stock || 0, category_id || null]
    );

    const itemId = result.insertId;

    if (req.file) {
      await db.promise().query(
        'INSERT INTO item_images (item_id, filename, filepath, filetype) VALUES (?, ?, ?, ?)',
        [itemId, req.file.originalname, imagePath, req.file.mimetype]
      );
    }

    return res.status(201).json({
      success: true,
      itemId,
      image: imagePath,
      stock: stock || 0
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error creating item', details: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id } = req.body;
    let imagePath;

    if (!name || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (req.file) {
      imagePath = `/uploads/items/${req.file.filename}`;
    }

    const [result] = await db.promise().query(
      'UPDATE items SET name = ?, description = ?, price = ?, stock = ?, category_id = ? WHERE id = ?',
      [name, description || null, price, stock || 0, category_id || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (req.file) {
      await db.promise().query(
        'INSERT INTO item_images (item_id, filename, filepath, filetype) VALUES (?, ?, ?, ?)',
        [id, req.file.originalname, imagePath, req.file.mimetype]
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error updating item', details: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.promise().query('DELETE FROM items WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error deleting item', details: error.message });
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
