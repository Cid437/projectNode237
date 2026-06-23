const express = require('express');
const router = express.Router();
const { getItems, searchItems, uploadItemImage } = require('../controllers/item');
const { getCategories } = require('../controllers/category');
const upload = require('../middleware/upload');

router.get('/items', getItems);
router.get('/categories', getCategories);
router.get('/search', searchItems);
router.post('/items/:id/upload', upload.single('image'), uploadItemImage);

module.exports = router;
