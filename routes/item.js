const express = require('express');
const router = express.Router();
const {
  getItems,
  getAllItems,
  getSingleItem,
  createItem,
  updateItem,
  deleteItem,
  searchItems,
  uploadItemImage
} = require('../controllers/item');
const upload = require('../middleware/upload');

router.get('/items', getItems);
router.get('/items/:id', getSingleItem);
router.get('/search', searchItems);
router.post('/items', upload.single('image'), createItem);
router.post('/items/:id/upload', upload.single('image'), uploadItemImage);
router.patch('/items/:id', upload.single('image'), updateItem);
router.delete('/items/:id', deleteItem);

module.exports = router;
