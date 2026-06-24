const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const {
    getAllItems,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem,
    searchItems
} = require('../controllers/item');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.get('/items', getAllItems);
router.get('/items/search/autocomplete', searchItems);
router.get('/items/:id', getSingleItem);
router.post('/items', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 5), createItem);
router.put('/items/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 5), updateItem);
router.delete('/items/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteItem);

module.exports = router;
