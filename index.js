const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");

// Load env vars
dotenv.config({ path: "./.env" });

// Connect to database
connectDB();

// Route files
const auth = require("./src/routes/authRoutes");
const products = require("./src/routes/productRoutes");

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Mount routers
app.get("/", (req, res) => {
  res.send("Welcome to the Cake Shop API");
});
app.use("/api/v1/auth", auth);
app.use("/api/v1/products", products);

// Error handling middleware
app.use((err, req, res, next) => {
  // If the error is an instance of our custom ErrorResponse
  if (err.send) {
    return err.send(res);
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
      statusCode: err.statusCode || 500,
      type: err.type || "ServerError",
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
