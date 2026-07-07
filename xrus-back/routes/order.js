const express = require('express');
const router = express.Router();

const { createOrder, getAllOrders, getSingleOrder, getMyOrders, updateOrder } = require('../controllers/order');
const { isAuthenticatedUser } = require('../middlewares/auth');
const { isAdminUser } = require('../middlewares/admin');

router.post('/create-order', isAuthenticatedUser, createOrder);
router.get('/orders', isAuthenticatedUser, isAdminUser, getAllOrders);
router.get('/my-orders', isAuthenticatedUser, getMyOrders);
router.get('/orders/:id', isAuthenticatedUser, getSingleOrder);
router.put('/orders/:id', isAuthenticatedUser, isAdminUser, updateOrder);

module.exports = router;