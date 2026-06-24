const db = require('../models');
const sequelize = db.sequelize;

exports.usersChart = async (req, res) => {
    try {
        const rows = await sequelize.query(
            'SELECT role, COUNT(*) AS total FROM users GROUP BY role',
            { type: sequelize.QueryTypes.SELECT }
        );
        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading users chart' });
    }
};

exports.salesChart = async (req, res) => {
    try {
        const rows = await sequelize.query(
            "SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month, SUM(amount) AS total FROM transactions GROUP BY month ORDER BY month",
            { type: sequelize.QueryTypes.SELECT }
        );
        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading sales chart' });
    }
};

exports.itemsChart = async (req, res) => {
    try {
        const rows = await sequelize.query(
            'SELECT name AS item, stock AS total FROM items ORDER BY stock DESC LIMIT 10',
            { type: sequelize.QueryTypes.SELECT }
        );
        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading items chart' });
    }
};
