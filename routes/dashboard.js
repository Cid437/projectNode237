const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard');
const auth = require('../middleware/auth');

router.get('/', auth.protect, auth.adminOnly, getDashboardStats);

module.exports = router;
