const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(protect, upload.array('images', 5), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, upload.array('images', 5), updateProduct)
  .delete(protect, deleteProduct);

module.exports = router; 