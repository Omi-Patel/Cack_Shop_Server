class ErrorResponse extends Error {
  /**
   * Create custom error response
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {object} [details] - Additional error details
   * @param {string} [type] - Error type/category
   * @param {string} [code] - Application-specific error code
   */
  constructor(
    message,
    statusCode,
    details = {},
    type = "OperationalError",
    code = null
  ) {
    super(message);
    this.statusCode = statusCode || 500;
    this.details = details;
    this.type = type;
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Development logging
    if (process.env.NODE_ENV === "development") {
      this.stackTrace = this.stack;
    }
  }

  /**
   * Send standardized error response
   * @param {object} res - Express response object
   * @param {object} [options] - Additional options
   * @param {boolean} [options.includeDetails] - Whether to include error details
   * @param {boolean} [options.includeStackTrace] - Whether to include stack trace
   */
  send(res, options = {}) {
    const {
      includeDetails = true,
      includeStackTrace = process.env.NODE_ENV === "development",
    } = options;

    const response = {
      success: false,
      error: {
        message: this.message,
        statusCode: this.statusCode,
        type: this.type,
        timestamp: this.timestamp,
        ...(this.code && { code: this.code }),
        ...(includeDetails &&
          Object.keys(this.details).length > 0 && { details: this.details }),
        ...(includeStackTrace && this.stackTrace && { stack: this.stackTrace }),
      },
    };

    // Additional security: Sanitize sensitive information
    if (response.error.details) {
      if (response.error.details.password)
        delete response.error.details.password;
      if (response.error.details.token) delete response.error.details.token;
    }

    res.status(this.statusCode).json(response);
  }

  /**
   * Convert error to plain object for logging
   */
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      type: this.type,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
    };
  }
}

module.exports = ErrorResponse;
