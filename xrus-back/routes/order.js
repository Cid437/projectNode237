const express = require('express');
const router = express.Router();

const { createOrder, getAllOrders, getSingleOrder, updateOrder, deleteOrder } = require('../controllers/order');
const { isAuthenticatedUser } = require('../middlewares/auth');
const { isAdminUser } = require('../middlewares/admin');

router.post('/create-order', isAuthenticatedUser, createOrder);
router.get('/orders', isAuthenticatedUser, isAdminUser, getAllOrders);
router.get('/orders/:id', isAuthenticatedUser, getSingleOrder);
router.put('/orders/:id', isAuthenticatedUser, isAdminUser, updateOrder);
router.delete('/orders/:id', isAuthenticatedUser, isAdminUser, deleteOrder);

module.exports = router;