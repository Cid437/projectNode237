const sequelize = require('../config/database');
const db = require('../models');
const { Item, ItemImage, Category } = db;

exports.getAllItems = async (req, res) => {
    try {
        const items = await Item.findAll({
            include: [{ model: Category, attributes: [] }],
            attributes: [
                'id', 'category_id', 'name', 'description', 'brand',
                'buy_price', 'sell_price', 'stock', 'image', 'status',
                'created_at', 'updated_at',
                [db.sequelize.col('Category.name'), 'category_name']
            ],
            order: [['id', 'DESC']],
            raw: true
        });

        return res.status(200).json({ rows: items });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching items', details: error.message });
    }
};

exports.getSingleItem = async (req, res) => {
    try {
        const item = await Item.findOne({
            where: { id: req.params.id },
            include: [{ model: Category, attributes: [] }],
            attributes: [
                'id', 'category_id', 'name', 'description', 'brand',
                'buy_price', 'sell_price', 'stock', 'image', 'status',
                'created_at', 'updated_at',
                [db.sequelize.col('Category.name'), 'category_name']
            ],
            raw: true
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        const images = await ItemImage.findAll({
            where: { item_id: req.params.id },
            attributes: ['id', 'image_path'],
            order: [['id', 'ASC']],
            raw: true
        });

        return res.status(200).json({ success: true, result: item, images });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching item', details: error.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { name, description, brand, buy_price, sell_price, stock, category_id, status = 'active' } = req.body;
        const imagePaths = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];
        const primaryImage = imagePaths[0] || null;

        if (!name || !buy_price || !sell_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const item = await Item.create({
            category_id: category_id || 1,
            name,
            description: description || '',
            brand: brand || '',
            buy_price,
            sell_price,
            stock: stock || 0,
            image: primaryImage,
            status
        });

        for (const imagePath of imagePaths) {
            await ItemImage.create({ item_id: item.id, image_path: imagePath });
        }

        return res.status(201).json({
            success: true,
            itemId: item.id,
            image: primaryImage,
            images: imagePaths,
            item: {
                id: item.id,
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

        const current = await Item.findByPk(id);
        if (!current) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const newImagePaths = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];
        const imagePath = newImagePaths[0] || current.image;

        await current.update({
            category_id: category_id || 1,
            name,
            description: description || '',
            brand: brand || '',
            buy_price,
            sell_price,
            stock: stock || 0,
            image: imagePath,
            status
        });

        // Only touch item_images when new files are actually uploaded, so editing
        // other fields never wipes out previously stored images.
        if (newImagePaths.length) {
            await ItemImage.destroy({ where: { item_id: id } });

            for (const newImagePath of newImagePaths) {
                await ItemImage.create({ item_id: id, image_path: newImagePath });
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating item', details: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        // order_items has no model yet (it's still an unmapped join table),
        // so this one relation is cleared with a raw query same as before.
        await sequelize.query('DELETE FROM order_items WHERE item_id = ?', { replacements: [id] });
        await ItemImage.destroy({ where: { item_id: id } });
        await Item.destroy({ where: { id } });

        return res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deleting item', details: error.message });
    }
};