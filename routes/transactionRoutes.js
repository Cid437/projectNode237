const express = require('express');
const router = express.Router();
const { getOrders, placeOrder, getOrderById, updateTransaction } = require('../controllers/transaction');
const auth = require('../middleware/auth');

router.get('/', auth.protect, getOrders);
router.post('/', auth.protect, placeOrder);
router.get('/:id', auth.protect, getOrderById);
router.put('/:id', auth.protect, updateTransaction);

module.exports = router;
