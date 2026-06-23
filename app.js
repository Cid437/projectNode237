const express = require('express');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const itemRoutes = require('./routes/item');
const orderRoutes = require('./routes/order');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: 'home.html' }));

// DB health middleware: return 503 for API routes when DB is unavailable
const db = require('./config/db');
app.use('/api', (req, res, next) => {
	if (!db._connected) {
		return res.status(503).json({ status: 'error', message: 'Database unavailable' });
	}
	next();
});

app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

module.exports = app