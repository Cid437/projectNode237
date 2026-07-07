const sequelize = require('../config/database');

exports.addressChart = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            'SELECT town AS addressline, COUNT(*) AS total FROM users WHERE town IS NOT NULL AND town <> "" GROUP BY town ORDER BY total DESC, town ASC'
        );

        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching address chart', details: error.message });
    }
};

exports.salesChart = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            "SELECT DATE_FORMAT(created_at, '%M') AS month, SUM(subtotal + shipping_fee - discount) AS total " +
            "FROM orders WHERE payment_status = 'Paid' OR order_status = 'Completed' " +
            "GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%M') ORDER BY created_at"
        );

        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching sales chart', details: error.message });
    }
};

exports.itemsChart = async (req, res) => {
    try {
        const [rows] = await sequelize.query(
            'SELECT i.name AS items, SUM(oi.quantity) AS total FROM order_items oi LEFT JOIN items i ON i.id = oi.item_id GROUP BY i.id, i.name ORDER BY total DESC'
        );

        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching items chart', details: error.message });
    }
};