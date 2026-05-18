const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const authRoutes       = require('./routes/auth.routes');
const calculatorRoutes = require('./routes/calculator.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health ─────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) =>
  res.json({ success: true, status: 'healthy', uptime: process.uptime() })
);

app.get('/', (req, res) =>
  res.json({
    success: true,
    message: 'Calculator API v2 🚀',
    version: '2.0.0',
    endpoints: {
      auth:       '/api/v1/auth',
      calculator: '/api/v1/calculator',
    },
  })
);

// ── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/calculator', calculatorRoutes);

// ── Error handlers ─────────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
