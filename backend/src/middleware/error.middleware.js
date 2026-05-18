const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // PostgreSQL unique violation (duplicate email)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Email already registered.',
    });
  }

  if (err.message === 'Division by zero is not allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
};

module.exports = { notFoundHandler, errorHandler };
