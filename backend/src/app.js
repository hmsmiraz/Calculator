const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const calculatorRoutes = require('./routes/calculator.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health check ───────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Calculator API is running 🚀',
    version: '1.0.0',
    endpoints: {
      calculate:     'POST /api/v1/calculator/calculate',
      add:           'POST /api/v1/calculator/add',
      subtract:      'POST /api/v1/calculator/subtract',
      multiply:      'POST /api/v1/calculator/multiply',
      divide:        'POST /api/v1/calculator/divide',
      operations:    'GET  /api/v1/calculator/operations',
    },
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api/v1/calculator', calculatorRoutes);

// ── Error handlers ─────────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
