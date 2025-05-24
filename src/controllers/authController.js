const User = require("../models/User");
const jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { name, email, phoneNumber, password } = req.body;

  // Validate required fields
  if (!name || !email || !phoneNumber || !password) {
    return next(new ErrorResponse("Please provide all required fields", 400));
  }

  try {
    // Check if user with email already exists
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return next(new ErrorResponse("Email is already registered", 400));
    }

    // Check if user with phone number already exists
    const existingPhoneUser = await User.findOne({ phoneNumber });
    if (existingPhoneUser) {
      return next(new ErrorResponse("Phone number is already registered", 400));
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return next(
        new ErrorResponse("Please provide a valid email address", 400)
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10,15}$/; // Adjust based on your requirements
    if (!phoneRegex.test(phoneNumber)) {
      return next(
        new ErrorResponse("Please provide a valid phone number", 400)
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return next(
        new ErrorResponse("Password must be at least 8 characters", 400)
      );
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      phoneNumber,
      password,
    });

    // Send token response
    createSendToken(user, 201, res); // 201 for resource created
  } catch (err) {
    // Handle duplicate key errors (in case unique indexes are bypassed)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return next(new ErrorResponse(`${field} is already registered`, 400));
    }
    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return next(new ErrorResponse(messages.join(", "), 400));
    }
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password is provided
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  try {
    // Check that user exists by email
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Check that password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

const signToken = (user) => {
  const secret = process.env.JWT_SECRET || "";
  const options = {
    expiresIn: "7d",
  };

  // Add any user fields you want in the token payload
  const payload = {
    id: user._id,
    email: user.email,
    name: user.name,
    phoneNumber: user.phoneNumber,
  };

  return jwt.sign(payload, secret, options);
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
  });
};
