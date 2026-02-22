const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, addReview, getCategories } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.post('/', protect, authorize('pharmacist', 'admin'), upload.array('product', 5), createProduct);
router.put('/:id', protect, authorize('pharmacist', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('pharmacist', 'admin'), deleteProduct);
router.post('/:id/review', protect, addReview);

module.exports = router;
