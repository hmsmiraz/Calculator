const express = require('express');
const router = express.Router();

const {
  calculateHandler,
  addHandler,
  subtractHandler,
  multiplyHandler,
  divideHandler,
  getOperations,
} = require('../controllers/calculator.controller');

const {
  validateTwoNumbers,
  validateCalculate,
} = require('../middleware/validators.middleware');

// ── GET ────────────────────────────────────────────────────────────────────────

// List all supported operations
router.get('/operations', getOperations);

// ── POST ───────────────────────────────────────────────────────────────────────

// Unified endpoint — requires operator in body
router.post('/calculate', validateCalculate, calculateHandler);

// Dedicated endpoints
router.post('/add',      validateTwoNumbers, addHandler);
router.post('/subtract', validateTwoNumbers, subtractHandler);
router.post('/multiply', validateTwoNumbers, multiplyHandler);
router.post('/divide',   validateTwoNumbers, divideHandler);

module.exports = router;
