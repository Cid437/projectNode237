const db = require('../config/database');

exports.getDashboardStats = (req, res) => {
    const stats = {};

    db.query('SELECT COUNT(*) AS total_users FROM users', (err, userResult) => {
        if (err) {
            console.error('Dashboard users count error:', err);
            return res.status(500).json({ status: 'error', error: 'Unable to fetch user count' });
        }

        stats.total_users = userResult[0]?.total_users || 0;

        db.query('SELECT COUNT(*) AS total_items FROM items', (err2, itemResult) => {
            if (err2) {
                console.error('Dashboard items count error:', err2);
                return res.status(500).json({ status: 'error', error: 'Unable to fetch items count' });
            }

            stats.total_items = itemResult[0]?.total_items || 0;

            db.query('SELECT COUNT(*) AS total_orders FROM transactions', (err3, orderResult) => {
                if (err3) {
                    console.error('Dashboard orders count error:', err3);
                    return res.status(500).json({ status: 'error', error: 'Unable to fetch orders count' });
                }

                stats.total_orders = orderResult[0]?.total_orders || 0;
                return res.json({ status: 'success', data: stats });
            });
        });
    });
};