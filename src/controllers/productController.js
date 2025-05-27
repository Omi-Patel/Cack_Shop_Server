const Product = require("../models/Product");
const ErrorResponse = require("../utils/errorResponse");
const { streamUpload } = require("../utils/fileUpload");

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, ingredients, allergens } =
      req.body;

    // Handle image uploads
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await streamUpload(file.buffer);
        imageUrls.push(result.secure_url);
      }
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      images: imageUrls,
      ingredients: ingredients ? JSON.parse(ingredients) : [],
      allergens: allergens ? JSON.parse(allergens) : [],
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(
        new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(
        new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
      );
    }

    // Handle image updates
    if (req.body.images) {
      // If images are provided as a string, parse it
      const imagesToKeep =
        typeof req.body.images === "string"
          ? JSON.parse(req.body.images)
          : req.body.images;

      // Filter out any images that aren't in the imagesToKeep array
      req.body.images = product.images.filter((img) =>
        imagesToKeep.includes(img)
      );
    }

    // Handle new image uploads if provided
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        const result = await streamUpload(file.buffer);
        imageUrls.push(result.secure_url);
      }
      req.body.images = [...(req.body.images || product.images), ...imageUrls];
    }

    // Parse arrays if they exist
    if (req.body.ingredients) {
      req.body.ingredients = JSON.parse(req.body.ingredients);
    }
    if (req.body.allergens) {
      req.body.allergens = JSON.parse(req.body.allergens);
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};
