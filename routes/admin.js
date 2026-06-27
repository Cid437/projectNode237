const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/admin');

router.use(auth.protect, auth.adminOnly);

router.get('/users', adminController.listUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/items', adminController.listItems);
router.post('/items', adminController.createItem);
router.patch('/items/:id', adminController.updateItem);
router.delete('/items/:id', adminController.deleteItem);
router.get('/orders', adminController.listOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.delete('/orders/:id', adminController.deleteOrder);

module.exports = router;
