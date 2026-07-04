const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

const { getAllItems, getSingleItem, createItem, updateItem, deleteItem } = require('../controllers/item');
const { isAuthenticatedUser } = require('../middlewares/auth');
const { isAdminUser } = require('../middlewares/admin');

router.get('/items', getAllItems);
router.get('/items/:id', getSingleItem);
router.post('/items', isAuthenticatedUser, isAdminUser, upload.single('image'), createItem);
router.put('/items/:id', isAuthenticatedUser, isAdminUser, upload.single('image'), updateItem);
router.delete('/items/:id', isAuthenticatedUser, isAdminUser, deleteItem);

module.exports = router;