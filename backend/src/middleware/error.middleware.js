/**
 * 404 handler — catches any request that didn't match a route.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global error handler — catches errors passed via next(err).
 * Must have 4 parameters for Express to treat it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // Known application errors (e.g. division by zero)
  if (err.message === 'Division by zero is not allowed') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown / unexpected errors
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
  });
};

module.exports = { notFoundHandler, errorHandler };
