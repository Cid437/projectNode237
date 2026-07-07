const express = require('express');
const router = express.Router();

const { createOrder, getAllOrders, getSingleOrder, getMyOrders, getOrderReceipt, getReceiptByToken, createReceiptToken, createTestEmail, updateOrder } = require('../controllers/order');
const { isAuthenticatedUser } = require('../middlewares/auth');
const { isAdminUser } = require('../middlewares/admin');

router.post('/create-order', isAuthenticatedUser, createOrder);
router.get('/orders', isAuthenticatedUser, isAdminUser, getAllOrders);
router.get('/orders/me', isAuthenticatedUser, getMyOrders);
router.get('/orders/receipt/:token', getReceiptByToken);
router.post('/orders/:id/token', isAuthenticatedUser, createReceiptToken);
router.get('/orders/:id/token', isAuthenticatedUser, createReceiptToken);
router.post('/test-email', createTestEmail);
router.get('/orders/:id/receipt', getOrderReceipt);
router.get('/orders/:id', isAuthenticatedUser, getSingleOrder);
router.put('/orders/:id', isAuthenticatedUser, isAdminUser, updateOrder);

module.exports = router;