const sequelize = require('../config/database');

exports.getAllItems = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            'SELECT i.id, i.category_id, i.name, i.description, i.brand, i.buy_price, i.sell_price, i.stock, i.image, i.status, i.created_at, i.updated_at, c.name AS category_name FROM items i LEFT JOIN categories c ON i.category_id = c.id ORDER BY i.id DESC'
        );

        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching items', details: error.message });
    }
};

exports.getSingleItem = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            'SELECT i.id, i.category_id, i.name, i.description, i.brand, i.buy_price, i.sell_price, i.stock, i.image, i.status, i.created_at, i.updated_at, c.name AS category_name FROM items i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = ? LIMIT 1',
            { replacements: [req.params.id] }
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        return res.status(200).json({ success: true, result: rows[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching item', details: error.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { name, description, brand, buy_price, sell_price, stock, category_id, status = 'active' } = req.body;
        const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : null;

        if (!name || !buy_price || !sell_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await sequelize.query(
            'INSERT INTO items (category_id, name, description, brand, buy_price, sell_price, stock, image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            {
                replacements: [category_id || 1, name, description || '', brand || '', buy_price, sell_price, stock || 0, imagePath, status]
            }
        );

        return res.status(201).json({
            success: true,
            itemId: result.insertId,
            image: imagePath,
            item: {
                id: result.insertId,
                name,
                description,
                sell_price,
                stock: stock || 0
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error creating item', details: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, brand, buy_price, sell_price, stock, category_id, status = 'active' } = req.body;

        if (!name || !buy_price || !sell_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [current] = await sequelize.query('SELECT image FROM items WHERE id = ? LIMIT 1', { replacements: [id] });
        const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : (current[0]?.image || null);

        await sequelize.query(
            'UPDATE items SET category_id = ?, name = ?, description = ?, brand = ?, buy_price = ?, sell_price = ?, stock = ?, image = ?, status = ? WHERE id = ?',
            {
                replacements: [category_id || 1, name, description || '', brand || '', buy_price, sell_price, stock || 0, imagePath, status, id]
            }
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating item', details: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        await sequelize.query('DELETE FROM order_items WHERE item_id = ?', { replacements: [id] });
        await sequelize.query('DELETE FROM items WHERE id = ?', { replacements: [id] });

        return res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deleting item', details: error.message });
    }
};