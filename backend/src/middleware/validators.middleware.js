const { body } = require('express-validator');

// ── Auth validators ────────────────────────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Calculator validators ──────────────────────────────────────────────────────

const validateTwoNumbers = [
  body('a').notEmpty().withMessage('"a" is required').isNumeric().withMessage('"a" must be a number'),
  body('b').notEmpty().withMessage('"b" is required').isNumeric().withMessage('"b" must be a number'),
];

const validateCalculate = [
  ...validateTwoNumbers,
  body('operator')
    .notEmpty().withMessage('"operator" is required')
    .isIn(['+', '-', '*', '/']).withMessage('Operator must be one of: +, -, *, /'),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTwoNumbers,
  validateCalculate,
};
