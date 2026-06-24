const { Op } = require('sequelize');
const db = require('../models');
const Item = db.Item;
const File = db.File;

exports.getAllItems = async (req, res) => {
    try {
        const page = parseInt(req.query.page || 1);
        const limit = parseInt(req.query.limit || 10);
        const offset = (page - 1) * limit;
        const keyword = req.query.search || '';

        const where = keyword ? {
            [Op.or]: [
                { name: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } }
            ]
        } : {};

        const result = await Item.findAndCountAll({
            where,
            include: [{ model: File }],
            limit,
            offset,
            order: [['id', 'DESC']]
        });

        return res.status(200).json({
            rows: result.rows,
            total: result.count,
            page,
            pages: Math.ceil(result.count / limit)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching items' });
    }
};

exports.getSingleItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id, {
            include: [{ model: File }]
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        return res.status(200).json({ success: true, result: item });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching item' });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const item = await Item.create({ name, description, price, stock: stock || 0 });
        const files = req.files || [];

        for (const file of files) {
            await File.create({
                item_id: item.id,
                filename: file.filename,
                filepath: `/uploads/${file.filename}`,
                filetype: file.filename.split('.').pop().toLowerCase()
            });
        }

        return res.status(201).json({ success: true, itemId: item.id, item });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error creating item', details: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const { name, description, price, stock } = req.body;
        await item.update({ name, description, price, stock });

        const files = req.files || [];
        for (const file of files) {
            await File.create({
                item_id: item.id,
                filename: file.filename,
                filepath: `/uploads/${file.filename}`,
                filetype: file.filename.split('.').pop().toLowerCase()
            });
        }

        return res.status(200).json({ success: true, item });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating item', details: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await File.destroy({ where: { item_id: item.id } });
        await item.destroy();

        return res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deleting item', details: error.message });
    }
};

exports.searchItems = async (req, res) => {
    try {
        const keyword = req.query.q || '';
        const rows = await Item.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyword}%` } },
                    { description: { [Op.like]: `%${keyword}%` } }
                ]
            },
            include: [{ model: File }],
            limit: 10
        });

        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error searching items' });
    }
};
