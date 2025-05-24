const express = require('express');
const { 
  uploadImage, 
  deleteImage, 
  getUserImages, 
  getImage 
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.post('/image', protect, upload.single('image'), uploadImage);
router.delete('/image/:public_id', protect, deleteImage);
router.get('/images', protect, getUserImages);
router.get('/image/:public_id', protect, getImage);

module.exports = router; 