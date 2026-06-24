const express = require('express');
const router = express.Router();
const { usersChart, salesChart, itemsChart } = require('../controllers/dashboard');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.get('/users-chart', isAuthenticatedUser, authorizeRoles('admin'), usersChart);
router.get('/sales-chart', isAuthenticatedUser, authorizeRoles('admin'), salesChart);
router.get('/items-chart', isAuthenticatedUser, authorizeRoles('admin'), itemsChart);

module.exports = router;
